import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

/** entered_at of the first time each lead reached the won stage, keyed by
 * crm_lead_id — used to compute "tempo médio até venda" without relying on
 * the free-text timeline. Scoped to a specific set of lead ids so it stays
 * consistent with whatever filters (period, origin, etc.) the caller already
 * applied to the base dataset. */
export async function getWonStageEnteredAtForLeads(
  supabase: SupabaseClient,
  crmLeadIds: string[],
  wonStageId: string,
): Promise<Map<string, string>> {
  if (crmLeadIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from("crm_lead_stage_history")
    .select("crm_lead_id, entered_at")
    .eq("stage_id", wonStageId)
    .in("crm_lead_id", crmLeadIds)
    .order("entered_at", { ascending: true });

  if (error) throw new Error(`Falha ao carregar histórico de estágio ganho: ${error.message}`);

  const map = new Map<string, string>();
  for (const row of (data ?? []) as { crm_lead_id: string; entered_at: string }[]) {
    if (!map.has(row.crm_lead_id)) map.set(row.crm_lead_id, row.entered_at);
  }
  return map;
}
