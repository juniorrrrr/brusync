import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { CrmLeadWithRelationsRow } from "@/repositories/crm/mappers";
import { mapCrmLeadWithRelations } from "@/repositories/crm/mappers";
import { listPipelineStages } from "@/repositories/crm/pipelineStagesRepository";
import type { CrmLeadWithRelations, PipelineStage } from "@/types/crm";

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
    supabase.from("crm_leads").select("stage_id"),
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
