import type { AnalyticsFilterState } from "@/types/analytics";

export const DEFAULT_ANALYTICS_FILTERS: AnalyticsFilterState = {
  periodo: "mes_atual",
  periodoInicio: null,
  periodoFim: null,
  responsavel: null,
  cliente: null,
  lead: null,
  projeto: null,
  origem: null,
  campanha: null,
  canal: null,
  cidade: null,
  status: null,
  pipeline: null,
  equipe: null,
};

export function mergeFilters(
  base: AnalyticsFilterState,
  patch: Partial<AnalyticsFilterState>,
): AnalyticsFilterState {
  return { ...base, ...patch };
}
