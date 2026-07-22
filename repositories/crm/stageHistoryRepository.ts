import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { mapStageHistory, type StageHistoryDbRow } from "@/repositories/crm/mappers";
import type { StageHistoryRow } from "@/types/crm";

/** Closes whatever stage-history row is currently open for this lead (there
 * should be at most one) and opens a new one for `stageId`. Called on lead
 * creation (open only, nothing to close yet) and on every stage change —
 * this is what makes "tempo parado nesta etapa", conversion between stages,
 * and average time per stage computable from real data instead of parsing
 * the free-text Timeline. */
export async function openStageHistory(
  supabase: SupabaseClient,
  crmLeadId: string,
  stageId: string,
): Promise<void> {
  const { error } = await supabase
    .from("crm_lead_stage_history")
    .insert({ crm_lead_id: crmLeadId, stage_id: stageId });

  if (error) throw new Error(`Falha ao abrir histórico de estágio: ${error.message}`);
}

export async function closeOpenStageHistory(
  supabase: SupabaseClient,
  crmLeadId: string,
): Promise<void> {
  const { error } = await supabase
    .from("crm_lead_stage_history")
    .update({ exited_at: new Date().toISOString() })
    .eq("crm_lead_id", crmLeadId)
    .is("exited_at", null);

  if (error) throw new Error(`Falha ao fechar histórico de estágio: ${error.message}`);
}

export async function transitionStageHistory(
  supabase: SupabaseClient,
  crmLeadId: string,
  newStageId: string,
): Promise<void> {
  await closeOpenStageHistory(supabase, crmLeadId);
  await openStageHistory(supabase, crmLeadId, newStageId);
}

export async function getOpenStageEntry(
  supabase: SupabaseClient,
  crmLeadId: string,
): Promise<StageHistoryRow | null> {
  const { data, error } = await supabase
    .from("crm_lead_stage_history")
    .select("id, crm_lead_id, stage_id, entered_at, exited_at")
    .eq("crm_lead_id", crmLeadId)
    .is("exited_at", null)
    .order("entered_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Falha ao carregar estágio atual: ${error.message}`);
  if (!data) return null;
  return mapStageHistory(data as StageHistoryDbRow);
}

/** Batch version for list views (Pipeline board) — one query for every
 * lead's currently-open stage entry, avoiding N+1. */
export async function getOpenStageEntriesForLeads(
  supabase: SupabaseClient,
  crmLeadIds: string[],
): Promise<Map<string, StageHistoryRow>> {
  if (crmLeadIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from("crm_lead_stage_history")
    .select("id, crm_lead_id, stage_id, entered_at, exited_at")
    .in("crm_lead_id", crmLeadIds)
    .is("exited_at", null);

  if (error) throw new Error(`Falha ao carregar estágios atuais: ${error.message}`);

  const map = new Map<string, StageHistoryRow>();
  for (const row of (data ?? []) as StageHistoryDbRow[]) {
    map.set(row.crm_lead_id, mapStageHistory(row));
  }
  return map;
}
