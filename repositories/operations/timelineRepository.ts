import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { IntegrationEventRow } from "@/domain/operations/feed";

/** Reads the Event Bus outbox (`integration_events`, Fase 6) directly — the
 * table's own doc comment already anticipates this: "a future dispatcher...
 * will poll integration_events independently; the CRM that publishes here
 * never needs to change for any of that." Mission Control is exactly that
 * kind of independent reader, never a second writer. */
export async function listRecentIntegrationEvents(
  supabase: SupabaseClient,
  limit = 40,
): Promise<IntegrationEventRow[]> {
  const { data, error } = await supabase
    .from("integration_events")
    .select("id, event_type, entity_id, payload, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Falha ao carregar eventos recentes: ${error.message}`);
  return (data ?? []) as IntegrationEventRow[];
}

export interface OverdueInstallmentSummary {
  count: number;
  amount: number;
}

/** No existing module exposes an installment-level overdue count (the
 * Financeiro dashboard's overdueAmount/overdueCount are at the transaction
 * level) — this is the one genuinely new aggregate query Mission Control
 * needs for the "Parcelas em atraso" card. */
export async function getOverdueInstallmentsSummary(
  supabase: SupabaseClient,
): Promise<OverdueInstallmentSummary> {
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("crm_financial_installments")
    .select("amount")
    .neq("status", "pago")
    .neq("status", "cancelado")
    .lt("due_date", nowIso);

  if (error) throw new Error(`Falha ao calcular parcelas em atraso: ${error.message}`);

  const rows = (data ?? []) as { amount: number }[];
  return { count: rows.length, amount: rows.reduce((sum, r) => sum + Number(r.amount), 0) };
}
