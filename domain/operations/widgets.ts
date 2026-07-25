import type { OperationsWidgetConfig, OperationsWidgetKey } from "@/types/operations";

export const OPERATIONS_WIDGET_LABEL: Record<OperationsWidgetKey, string> = {
  kpis: "Cards principais",
  feed: "Feed em tempo real",
  agenda: "Agenda do dia",
  pendencias: "Minha fila",
  alertas: "Alertas críticos",
  insights: "Insights novos",
  timeline: "Timeline global",
  financeiro: "Saúde financeira",
  marketing: "Saúde de marketing",
  projetos: "Saúde de projetos",
  performance: "Metas e performance",
};

/** Every user starts with every widget visible, in this order — the only
 * "default layout" the app ships with. Personalization (hide/show/reorder)
 * is stored per-user in operations_layouts and always read as an override
 * of this list, never a replacement of it (a widget added to the catalog
 * later still shows up for users with an older saved layout). */
export const DEFAULT_OPERATIONS_LAYOUT: OperationsWidgetConfig[] = [
  { key: "kpis", visible: true, order: 0 },
  { key: "alertas", visible: true, order: 1 },
  { key: "pendencias", visible: true, order: 2 },
  { key: "agenda", visible: true, order: 3 },
  { key: "feed", visible: true, order: 4 },
  { key: "insights", visible: true, order: 5 },
  { key: "timeline", visible: true, order: 6 },
  { key: "financeiro", visible: true, order: 7 },
  { key: "marketing", visible: true, order: 8 },
  { key: "projetos", visible: true, order: 9 },
  { key: "performance", visible: true, order: 10 },
];

/** Merges a user's saved layout with the widget catalog above — any widget
 * missing from the saved layout (new widget shipped after the user last
 * saved) is appended as visible, any saved entry for a widget that no
 * longer exists is dropped. Keeps operations_layouts from ever going stale
 * or crashing the page when the catalog changes. */
export function mergeLayoutWithCatalog(saved: OperationsWidgetConfig[]): OperationsWidgetConfig[] {
  const savedByKey = new Map(saved.map((w) => [w.key, w]));
  const merged = DEFAULT_OPERATIONS_LAYOUT.map((defaultWidget, index) => {
    const override = savedByKey.get(defaultWidget.key);
    return override ?? { ...defaultWidget, order: index };
  });
  return merged.sort((a, b) => a.order - b.order);
}
