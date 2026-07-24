import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  DelinquentClient,
  OverdueProject,
  OwnerConversion,
  StaleLead,
} from "@/domain/intelligence/dataset";

/** Raw, read-only queries the Fase 19 engine needs that no existing
 * module's application layer already exposes in the right shape (stalled
 * leads with day counts, per-owner win rate, delinquent clients grouped by
 * client, response-time gaps...). Every table here is one already owned by
 * another module — nothing is duplicated, this only computes a derived
 * view over it for the engine's own evidence/scoring needs. */

interface LeadStalenessRow {
  id: string;
  name: string;
  company: string | null;
  last_interaction_at: string | null;
  created_at: string;
  owner: { name: string | null; email: string | null } | null;
  stage: { is_won: boolean } | null;
}

const STALENESS_SELECT = `
  id, name, company, last_interaction_at, created_at,
  owner:profiles!crm_leads_owner_id_fkey (name, email),
  stage:pipeline_stages!crm_leads_stage_id_fkey!inner (is_won)
`;

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

/** Open leads (not won, not lost) whose last interaction — or creation,
 * when there was never one — is older than `staleDays`. */
export async function listStaleLeads(
  supabase: SupabaseClient,
  staleDays: number,
): Promise<StaleLead[]> {
  const { data, error } = await supabase
    .from("crm_leads")
    .select(STALENESS_SELECT)
    .is("lost_reason", null)
    .eq("stage.is_won", false);

  if (error) throw new Error(`Falha ao carregar leads parados: ${error.message}`);

  const rows = (data ?? []) as unknown as LeadStalenessRow[];
  return rows
    .map((row) => {
      const referenceDate = row.last_interaction_at ?? row.created_at;
      return {
        id: row.id,
        name: row.name,
        company: row.company,
        ownerName: row.owner?.name ?? row.owner?.email ?? null,
        lastInteractionAt: row.last_interaction_at,
        daysSinceContact: daysSince(referenceDate),
      };
    })
    .filter((lead) => lead.daysSinceContact >= staleDays)
    .sort((a, b) => b.daysSinceContact - a.daysSinceContact);
}

/** Open leads that never received a single interaction. */
export async function listNeverContactedLeads(supabase: SupabaseClient): Promise<StaleLead[]> {
  const { data, error } = await supabase
    .from("crm_leads")
    .select(STALENESS_SELECT)
    .is("lost_reason", null)
    .eq("stage.is_won", false)
    .is("last_interaction_at", null);

  if (error) throw new Error(`Falha ao carregar leads sem contato: ${error.message}`);

  const rows = (data ?? []) as unknown as LeadStalenessRow[];
  return rows
    .map((row) => ({
      id: row.id,
      name: row.name,
      company: row.company,
      ownerName: row.owner?.name ?? row.owner?.email ?? null,
      lastInteractionAt: null,
      daysSinceContact: daysSince(row.created_at),
    }))
    .sort((a, b) => b.daysSinceContact - a.daysSinceContact);
}

interface OwnerLeadRow {
  owner_id: string | null;
  owner: { name: string | null; email: string | null } | null;
  lost_reason: string | null;
  stage: { is_won: boolean } | null;
}

/** Win rate per owner, over every RESOLVED lead (won or lost) — leads still
 * open in the pipeline are excluded, same reasoning as
 * dashboardRepository.getWinLossSummary (an open lead hasn't resolved into
 * either bucket yet, counting it would understate every owner's rate). */
export async function getOwnerConversion(supabase: SupabaseClient): Promise<OwnerConversion[]> {
  const { data, error } = await supabase
    .from("crm_leads")
    .select(
      "owner_id, lost_reason, owner:profiles!crm_leads_owner_id_fkey (name, email), stage:pipeline_stages!crm_leads_stage_id_fkey!inner (is_won)",
    );

  if (error) throw new Error(`Falha ao calcular conversão por responsável: ${error.message}`);

  const rows = (data ?? []) as unknown as OwnerLeadRow[];
  const byOwner = new Map<string, OwnerConversion>();

  for (const row of rows) {
    const isWon = row.stage?.is_won === true;
    const isLost = row.lost_reason !== null;
    if (!isWon && !isLost) continue;

    const key = row.owner_id ?? "sem_responsavel";
    const existing = byOwner.get(key) ?? {
      ownerId: row.owner_id,
      ownerName: row.owner?.name ?? row.owner?.email ?? "Sem responsável",
      totalLeads: 0,
      wonLeads: 0,
      winRate: 0,
    };
    existing.totalLeads += 1;
    if (isWon) existing.wonLeads += 1;
    byOwner.set(key, existing);
  }

  return [...byOwner.values()]
    .map((o) => ({ ...o, winRate: o.totalLeads > 0 ? (o.wonLeads / o.totalLeads) * 100 : 0 }))
    .sort((a, b) => b.winRate - a.winRate);
}

export async function getDaysSinceLastStageChange(
  supabase: SupabaseClient,
): Promise<number | null> {
  const { data, error } = await supabase
    .from("crm_lead_stage_history")
    .select("entered_at")
    .order("entered_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error)
    throw new Error(`Falha ao verificar última movimentação do pipeline: ${error.message}`);
  const row = data as { entered_at: string } | null;
  return row ? daysSince(row.entered_at) : null;
}

interface OverdueTransactionRow {
  amount: number;
  due_date: string;
  client_id: string | null;
  client: { company: string } | null;
}

export async function listDelinquentClients(supabase: SupabaseClient): Promise<DelinquentClient[]> {
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("crm_financial_transactions")
    .select(
      "amount, due_date, client_id, client:clients!crm_financial_transactions_client_id_fkey (company)",
    )
    .eq("kind", "receita")
    .neq("status", "pago")
    .neq("status", "cancelado")
    .not("client_id", "is", null)
    .lt("due_date", nowIso);

  if (error) throw new Error(`Falha ao carregar clientes inadimplentes: ${error.message}`);

  const rows = (data ?? []) as unknown as OverdueTransactionRow[];
  const byClient = new Map<string, DelinquentClient>();

  for (const row of rows) {
    if (!row.client_id) continue;
    const existing = byClient.get(row.client_id) ?? {
      clientId: row.client_id,
      clientCompany: row.client?.company ?? "—",
      overdueAmount: 0,
      overdueCount: 0,
      oldestDueDate: row.due_date,
    };
    existing.overdueAmount += Number(row.amount);
    existing.overdueCount += 1;
    if (row.due_date < existing.oldestDueDate) existing.oldestDueDate = row.due_date;
    byClient.set(row.client_id, existing);
  }

  return [...byClient.values()].sort((a, b) => b.overdueAmount - a.overdueAmount);
}

interface OverdueProjectRow {
  id: string;
  name: string;
  due_at: string;
  client: { company: string } | null;
}

export async function listOverdueProjects(supabase: SupabaseClient): Promise<OverdueProject[]> {
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("crm_projects")
    .select("id, name, due_at, client:clients!crm_projects_client_id_fkey (company)")
    .not("due_at", "is", null)
    .lt("due_at", nowIso)
    .not("status", "in", "(concluido,cancelado)");

  if (error) throw new Error(`Falha ao carregar projetos atrasados: ${error.message}`);

  return ((data ?? []) as unknown as OverdueProjectRow[])
    .map((row) => ({
      id: row.id,
      name: row.name,
      clientCompany: row.client?.company ?? null,
      dueAt: row.due_at,
      daysOverdue: daysSince(row.due_at),
    }))
    .sort((a, b) => b.daysOverdue - a.daysOverdue);
}

interface MessageRow {
  conversation_id: string;
  direction: "inbound" | "outbound";
  created_at: string;
}

/** Average minutes between an inbound message and the next outbound reply
 * in the same conversation, within [from, to] — the closest thing to
 * "tempo médio de resposta" the schema supports without a dedicated
 * response-time column. */
export async function getAverageResponseMinutes(
  supabase: SupabaseClient,
  from: string,
  to: string,
): Promise<number | null> {
  const { data, error } = await supabase
    .from("crm_messages")
    .select("conversation_id, direction, created_at")
    .gte("created_at", from)
    .lte("created_at", to)
    .order("conversation_id", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Falha ao calcular tempo médio de resposta: ${error.message}`);

  const rows = (data ?? []) as MessageRow[];
  const gaps: number[] = [];
  let pendingInboundAt: string | null = null;
  let currentConversation: string | null = null;

  for (const row of rows) {
    if (row.conversation_id !== currentConversation) {
      currentConversation = row.conversation_id;
      pendingInboundAt = null;
    }
    if (row.direction === "inbound") {
      pendingInboundAt = row.created_at;
    } else if (row.direction === "outbound" && pendingInboundAt) {
      const gapMinutes =
        (new Date(row.created_at).getTime() - new Date(pendingInboundAt).getTime()) / 60_000;
      if (gapMinutes >= 0) gaps.push(gapMinutes);
      pendingInboundAt = null;
    }
  }

  if (gaps.length === 0) return null;
  return gaps.reduce((sum, g) => sum + g, 0) / gaps.length;
}

export async function getTotalStorageBytes(supabase: SupabaseClient): Promise<number> {
  const [projectFiles, financialDocs, knowledgeFiles] = await Promise.all([
    supabase.from("crm_project_files").select("file_size"),
    supabase.from("crm_financial_documents").select("file_size"),
    supabase.from("crm_knowledge_files").select("file_size"),
  ]);

  const sum = (rows: { file_size: number | null }[] | null) =>
    (rows ?? []).reduce((total, row) => total + (row.file_size ?? 0), 0);

  return sum(projectFiles.data) + sum(financialDocs.data) + sum(knowledgeFiles.data);
}
