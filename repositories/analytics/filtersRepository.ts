import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_ANALYTICS_FILTERS } from "@/domain/analytics/filters";
import type {
  AnalyticsFilterKey,
  AnalyticsFilterState,
  AnalyticsPeriodKey,
} from "@/types/analytics";

interface FilterRow {
  key: AnalyticsFilterKey;
  value: string | null;
}

export async function getDashboardFilters(
  supabase: SupabaseClient,
  dashboardId: string,
): Promise<AnalyticsFilterState> {
  const { data, error } = await supabase
    .from("analytics_filters")
    .select("key, value")
    .eq("dashboard_id", dashboardId);

  if (error) throw new Error(`Falha ao carregar filtros do dashboard: ${error.message}`);

  const state = { ...DEFAULT_ANALYTICS_FILTERS };
  for (const row of (data ?? []) as FilterRow[]) {
    if (row.key === "periodo") state.periodo = (row.value as AnalyticsPeriodKey) ?? state.periodo;
    else if (row.key === "responsavel") state.responsavel = row.value;
    else if (row.key === "cliente") state.cliente = row.value;
    else if (row.key === "lead") state.lead = row.value;
    else if (row.key === "projeto") state.projeto = row.value;
    else if (row.key === "origem") state.origem = row.value;
    else if (row.key === "campanha") state.campanha = row.value;
    else if (row.key === "canal") state.canal = row.value;
    else if (row.key === "cidade") state.cidade = row.value;
    else if (row.key === "status") state.status = row.value;
    else if (row.key === "pipeline") state.pipeline = row.value;
    else if (row.key === "equipe") state.equipe = row.value;
  }
  return state;
}

export async function saveDashboardFilters(
  supabase: SupabaseClient,
  dashboardId: string,
  filters: AnalyticsFilterState,
): Promise<void> {
  const rows = [
    { key: "periodo", value: filters.periodo },
    { key: "responsavel", value: filters.responsavel },
    { key: "cliente", value: filters.cliente },
    { key: "lead", value: filters.lead },
    { key: "projeto", value: filters.projeto },
    { key: "origem", value: filters.origem },
    { key: "campanha", value: filters.campanha },
    { key: "canal", value: filters.canal },
    { key: "cidade", value: filters.cidade },
    { key: "status", value: filters.status },
    { key: "pipeline", value: filters.pipeline },
    { key: "equipe", value: filters.equipe },
  ].map((row) => ({ dashboard_id: dashboardId, key: row.key, value: row.value }));

  const { error } = await supabase
    .from("analytics_filters")
    .upsert(rows, { onConflict: "dashboard_id,key" });
  if (error) throw new Error(`Falha ao salvar filtros do dashboard: ${error.message}`);
}
