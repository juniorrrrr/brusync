import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { LOST_REASON_LABEL, LOST_REASONS } from "@/domain/crm/lostRules";
import type { CrmLeadWithRelationsRow } from "@/repositories/crm/mappers";
import { mapCrmLeadWithRelations } from "@/repositories/crm/mappers";
import { listPipelineStages } from "@/repositories/crm/pipelineStagesRepository";
import type { CrmLeadWithRelations, LostReason, PipelineStage } from "@/types/crm";

export async function countLeadsSince(supabase: SupabaseClient, sinceIso: string): Promise<number> {
  const { count, error } = await supabase
    .from("crm_leads")
    .select("*", { count: "exact", head: true })
    .gte("created_at", sinceIso);

  if (error) throw new Error(`Falha ao contar leads: ${error.message}`);
  return count ?? 0;
}

export async function countWonLeadsSince(
  supabase: SupabaseClient,
  sinceIso: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("crm_leads")
    .select("id, stage:pipeline_stages!crm_leads_stage_id_fkey!inner(is_won)", {
      count: "exact",
      head: true,
    })
    .eq("stage.is_won", true)
    .gte("updated_at", sinceIso);

  if (error) throw new Error(`Falha ao contar leads convertidos: ${error.message}`);
  return count ?? 0;
}

export async function getAveragePotentialValue(supabase: SupabaseClient): Promise<number | null> {
  const { data, error } = await supabase
    .from("crm_leads")
    .select("potential_value")
    .not("potential_value", "is", null);

  if (error) throw new Error(`Falha ao calcular ticket médio: ${error.message}`);
  if (!data || data.length === 0) return null;

  const total = data.reduce((sum, row) => sum + Number(row.potential_value ?? 0), 0);
  return total / data.length;
}

export interface DailyCount {
  date: string;
  count: number;
}

export async function getDailyLeadCounts(
  supabase: SupabaseClient,
  days = 14,
): Promise<DailyCount[]> {
  const since = new Date();
  since.setDate(since.getDate() - (days - 1));
  since.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("crm_leads")
    .select("created_at")
    .gte("created_at", since.toISOString());

  if (error) throw new Error(`Falha ao carregar série de leads: ${error.message}`);

  const buckets = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const day = new Date(since);
    day.setDate(day.getDate() + i);
    buckets.set(day.toISOString().slice(0, 10), 0);
  }

  for (const row of data ?? []) {
    const key = row.created_at.slice(0, 10);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  return [...buckets.entries()].map(([date, count]) => ({ date, count }));
}

export interface StageCount {
  stage: PipelineStage;
  count: number;
}

export async function getLeadsGroupedByStage(supabase: SupabaseClient): Promise<StageCount[]> {
  const [stages, { data, error }] = await Promise.all([
    listPipelineStages(supabase),
    // Lost leads are orthogonal to stage (see lostRules) — excluded here so
    // they don't inflate whichever stage they were sitting in when lost.
    supabase.from("crm_leads").select("stage_id").is("lost_reason", null),
  ]);

  if (error) throw new Error(`Falha ao agrupar leads por estágio: ${error.message}`);

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    counts.set(row.stage_id, (counts.get(row.stage_id) ?? 0) + 1);
  }

  return stages.map((stage) => ({ stage, count: counts.get(stage.id) ?? 0 }));
}

export interface OriginCount {
  label: string;
  count: number;
}

export async function getLeadsGroupedByOrigin(
  supabase: SupabaseClient,
  topN = 5,
): Promise<OriginCount[]> {
  const { data, error } = await supabase.from("crm_leads").select("origin");
  if (error) throw new Error(`Falha ao agrupar leads por origem: ${error.message}`);

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const label = row.origin?.trim() || "Não informado";
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  const sorted = [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);

  if (sorted.length <= topN) return sorted;

  const top = sorted.slice(0, topN);
  const othersCount = sorted.slice(topN).reduce((sum, item) => sum + item.count, 0);
  return othersCount > 0 ? [...top, { label: "Outros", count: othersCount }] : top;
}

const AWAITING_CONTACT_SELECT = `
  id, created_at, updated_at, source_lead_id, name, company, email, phone, origin,
  stage_id, owner_id, potential_value, score, tags, last_interaction_at, created_by,
  stage:pipeline_stages!crm_leads_stage_id_fkey!inner (id, key, label, color, position, is_won),
  owner:profiles!crm_leads_owner_id_fkey (id, name, email)
`;

export async function listAwaitingContactLeads(
  supabase: SupabaseClient,
  limit = 6,
): Promise<CrmLeadWithRelations[]> {
  const { data, error } = await supabase
    .from("crm_leads")
    .select(AWAITING_CONTACT_SELECT)
    .eq("stage.position", 1)
    .is("last_interaction_at", null)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) throw new Error(`Falha ao carregar leads aguardando contato: ${error.message}`);

  return ((data ?? []) as unknown as CrmLeadWithRelationsRow[]).map(mapCrmLeadWithRelations);
}

/* ============================================================
   Fase 4 — Dashboard Comercial: conversão, tempo por estágio,
   ganho/perda, motivos de perda, tempo até venda, sem atividade,
   atrasados. Todas baseadas em crm_lead_stage_history (append-only,
   invariante "no máximo uma linha aberta por lead").
   ============================================================ */

export interface StageConversion {
  stage: PipelineStage;
  enteredCount: number;
  conversionFromPrevious: number | null;
}

/** "Conversão entre etapas": quantos leads distintos já entraram em cada
 * estágio (histórico completo, não apenas os que estão lá agora) e a % em
 * relação ao estágio anterior no funil. */
export async function getStageConversion(supabase: SupabaseClient): Promise<StageConversion[]> {
  const [stages, { data, error }] = await Promise.all([
    listPipelineStages(supabase),
    supabase.from("crm_lead_stage_history").select("stage_id, crm_lead_id"),
  ]);

  if (error) throw new Error(`Falha ao calcular conversão entre etapas: ${error.message}`);

  const leadsByStage = new Map<string, Set<string>>();
  for (const row of data ?? []) {
    const set = leadsByStage.get(row.stage_id) ?? new Set<string>();
    set.add(row.crm_lead_id);
    leadsByStage.set(row.stage_id, set);
  }

  const ordered = [...stages].sort((a, b) => a.position - b.position);
  let previousCount: number | null = null;
  return ordered.map((stage) => {
    const enteredCount = leadsByStage.get(stage.id)?.size ?? 0;
    const conversionFromPrevious =
      previousCount !== null && previousCount > 0 ? (enteredCount / previousCount) * 100 : null;
    previousCount = enteredCount;
    return { stage, enteredCount, conversionFromPrevious };
  });
}

export interface StageAvgDuration {
  stage: PipelineStage;
  avgDays: number | null;
}

/** "Tempo médio em cada estágio" — apenas passagens já concluídas
 * (exited_at preenchido), para não subestimar com leads ainda parados. */
export async function getAverageTimeInStage(supabase: SupabaseClient): Promise<StageAvgDuration[]> {
  const [stages, { data, error }] = await Promise.all([
    listPipelineStages(supabase),
    supabase
      .from("crm_lead_stage_history")
      .select("stage_id, entered_at, exited_at")
      .not("exited_at", "is", null),
  ]);

  if (error) throw new Error(`Falha ao calcular tempo médio por estágio: ${error.message}`);

  const durationsByStage = new Map<string, number[]>();
  for (const row of (data ?? []) as { stage_id: string; entered_at: string; exited_at: string }[]) {
    const days =
      (new Date(row.exited_at).getTime() - new Date(row.entered_at).getTime()) / 86_400_000;
    const list = durationsByStage.get(row.stage_id) ?? [];
    list.push(days);
    durationsByStage.set(row.stage_id, list);
  }

  return [...stages]
    .sort((a, b) => a.position - b.position)
    .map((stage) => {
      const list = durationsByStage.get(stage.id);
      const avgDays =
        list && list.length > 0 ? list.reduce((a, b) => a + b, 0) / list.length : null;
      return { stage, avgDays };
    });
}

export interface WinLossSummary {
  won: number;
  lost: number;
  winRate: number;
  lossRate: number;
}

/** "Taxa de ganho" / "Taxa de perda" — sobre o total de leads resolvidos
 * (ganhos + perdidos), não sobre o total geral (que incluiria leads ainda
 * em aberto e distorceria a taxa). */
export async function getWinLossSummary(supabase: SupabaseClient): Promise<WinLossSummary> {
  const [wonResult, lostResult] = await Promise.all([
    supabase
      .from("crm_leads")
      .select("id, stage:pipeline_stages!crm_leads_stage_id_fkey!inner(is_won)", {
        count: "exact",
        head: true,
      })
      .eq("stage.is_won", true),
    supabase
      .from("crm_leads")
      .select("*", { count: "exact", head: true })
      .not("lost_reason", "is", null),
  ]);

  if (wonResult.error) throw new Error(`Falha ao contar leads ganhos: ${wonResult.error.message}`);
  if (lostResult.error)
    throw new Error(`Falha ao contar leads perdidos: ${lostResult.error.message}`);

  const won = wonResult.count ?? 0;
  const lost = lostResult.count ?? 0;
  const totalResolved = won + lost;

  return {
    won,
    lost,
    winRate: totalResolved > 0 ? (won / totalResolved) * 100 : 0,
    lossRate: totalResolved > 0 ? (lost / totalResolved) * 100 : 0,
  };
}

export interface LossReasonCount {
  reason: LostReason;
  label: string;
  count: number;
}

/** "Motivos de perda" agrupados — alimenta a futura tela de Analytics. */
export async function getLossReasonBreakdown(supabase: SupabaseClient): Promise<LossReasonCount[]> {
  const { data, error } = await supabase
    .from("crm_leads")
    .select("lost_reason")
    .not("lost_reason", "is", null);

  if (error) throw new Error(`Falha ao agrupar motivos de perda: ${error.message}`);

  const counts = new Map<LostReason, number>();
  for (const row of (data ?? []) as { lost_reason: LostReason }[]) {
    counts.set(row.lost_reason, (counts.get(row.lost_reason) ?? 0) + 1);
  }

  return LOST_REASONS.map((reason) => ({
    reason,
    label: LOST_REASON_LABEL[reason],
    count: counts.get(reason) ?? 0,
  })).sort((a, b) => b.count - a.count);
}

/** "Tempo médio até venda" — do created_at do lead até o entered_at da
 * passagem pelo estágio marcado como ganho (is_won). */
export async function getAverageTimeToWinDays(supabase: SupabaseClient): Promise<number | null> {
  const { data, error } = await supabase
    .from("crm_lead_stage_history")
    .select(
      "entered_at, stage:pipeline_stages!crm_lead_stage_history_stage_id_fkey!inner(is_won), lead:crm_leads!crm_lead_stage_history_crm_lead_id_fkey(created_at)",
    )
    .eq("stage.is_won", true);

  if (error) throw new Error(`Falha ao calcular tempo médio até venda: ${error.message}`);

  const rows = (data ?? []) as unknown as {
    entered_at: string;
    lead: { created_at: string } | null;
  }[];

  const days = rows
    .filter((row) => row.lead)
    .map(
      (row) =>
        (new Date(row.entered_at).getTime() -
          new Date((row.lead as { created_at: string }).created_at).getTime()) /
        86_400_000,
    );

  if (days.length === 0) return null;
  return days.reduce((a, b) => a + b, 0) / days.length;
}

/** "Leads sem atividade" — em aberto (não ganhos, não perdidos) e sem
 * interação registrada há mais de `staleDays` (ou nunca tiveram nenhuma). */
export async function countLeadsWithoutActivity(
  supabase: SupabaseClient,
  staleDays = 7,
): Promise<number> {
  const staleBefore = new Date(Date.now() - staleDays * 86_400_000).toISOString();

  const { count, error } = await supabase
    .from("crm_leads")
    .select("id, stage:pipeline_stages!crm_leads_stage_id_fkey!inner(is_won)", {
      count: "exact",
      head: true,
    })
    .is("lost_reason", null)
    .eq("stage.is_won", false)
    .or(`last_interaction_at.is.null,last_interaction_at.lt.${staleBefore}`);

  if (error) throw new Error(`Falha ao contar leads sem atividade: ${error.message}`);
  return count ?? 0;
}

/** "Leads atrasados" — têm uma tarefa (próxima ação) pendente com due_at no
 * passado. Contagem por lead distinto, não por tarefa. */
export async function countOverdueLeads(supabase: SupabaseClient): Promise<number> {
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("crm_lead_tasks")
    .select("crm_lead_id")
    .neq("status", "done")
    .lt("due_at", nowIso);

  if (error) throw new Error(`Falha ao contar leads atrasados: ${error.message}`);
  return new Set((data ?? []).map((row) => row.crm_lead_id as string)).size;
}
