import "server-only";

import { ANALYTICS_METRIC_KEYS, ANALYTICS_METRICS } from "@/domain/analytics/metricsCatalog";
import {
  getDemoAnalyticsDashboardDetail,
  getDemoAnalyticsDashboards,
} from "@/lib/demo/mockAnalytics";
import { listDashboards } from "@/repositories/analytics/dashboardsRepository";
import { listWidgets } from "@/repositories/analytics/widgetsRepository";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type { AnalyticsSearchResult } from "@/types/analytics";

function matches(term: string, value: string | null): boolean {
  return !!value && value.toLowerCase().includes(term);
}

/** Busca combinada — dashboards, widgets (por título) e o catálogo estático
 * de métricas (domain/analytics/metricsCatalog.ts); nenhuma consulta nova,
 * só filtra o que já foi listado. */
export async function searchAnalytics(term: string): Promise<AnalyticsSearchResult[]> {
  const normalized = term.trim().toLowerCase();
  if (!normalized) return [];

  const results: AnalyticsSearchResult[] = [];

  const dashboards = (await isDemoModeActive())
    ? getDemoAnalyticsDashboards()
    : await listDashboards(await getSupabaseAuthClient(), { status: "ativo" });

  for (const dashboard of dashboards) {
    if (matches(normalized, dashboard.name) || matches(normalized, dashboard.description)) {
      results.push({
        kind: "dashboard",
        id: dashboard.id,
        label: dashboard.name,
        description: dashboard.description,
        href: `/analytics/${dashboard.id}`,
      });
    }
  }

  const demo = await isDemoModeActive();
  for (const dashboard of dashboards.slice(0, 10)) {
    const widgets = demo
      ? (getDemoAnalyticsDashboardDetail(dashboard.id)?.widgets ?? [])
      : await listWidgets(await getSupabaseAuthClient(), dashboard.id);
    for (const widget of widgets) {
      if (matches(normalized, widget.title)) {
        results.push({
          kind: "widget",
          id: widget.id,
          label: widget.title,
          description: `Em "${dashboard.name}"`,
          href: `/analytics/${dashboard.id}`,
        });
      }
    }
  }

  for (const key of ANALYTICS_METRIC_KEYS) {
    const meta = ANALYTICS_METRICS[key];
    if (matches(normalized, meta.label)) {
      results.push({ kind: "metric", id: key, label: meta.label, description: null, href: null });
    }
  }

  return results.slice(0, 30);
}
