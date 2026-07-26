"use server";

import { requireCrmProfile } from "@/application/crm/authGuard";
import { resolveMetric } from "@/services/analytics/analyticsMetricsService";
import type { AnalyticsFilterState, AnalyticsWidget, AnalyticsWidgetData } from "@/types/analytics";

/** Reavalia todos os widgets de um dashboard para o conjunto de filtros
 * atual — chamado sempre que o usuário muda período/responsável/etc. na UI
 * (client-side, sem reload de página). Cada widget é resolvido por
 * services/analytics/analyticsMetricsService.ts, que só consulta as
 * camadas de aplicação já existentes; esta action não calcula nada, só
 * paraleliza as chamadas e devolve o resultado tipado para o cliente. */
export async function resolveWidgetsDataAction(
  widgets: AnalyticsWidget[],
  filters: AnalyticsFilterState,
): Promise<AnalyticsWidgetData[]> {
  await requireCrmProfile();

  return Promise.all(
    widgets.map(async (widget) => ({
      widget,
      result: await resolveMetric(widget.dataSource, widget.metric, filters),
    })),
  );
}
