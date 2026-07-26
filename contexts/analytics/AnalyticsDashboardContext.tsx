"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
  useTransition,
} from "react";
import { saveDashboardFiltersAction } from "@/application/analytics/analyticsActions";
import { resolveWidgetsDataAction } from "@/application/analytics/analyticsDataActions";
import type { AnalyticsFilterState, AnalyticsWidget, AnalyticsWidgetData } from "@/types/analytics";

interface AnalyticsDashboardContextValue {
  dashboardId: string;
  widgets: AnalyticsWidget[];
  widgetsData: AnalyticsWidgetData[];
  filters: AnalyticsFilterState;
  isPending: boolean;
  editMode: boolean;
  setEditMode: (value: boolean) => void;
  updateFilters: (patch: Partial<AnalyticsFilterState>) => void;
}

const AnalyticsDashboardContext = createContext<AnalyticsDashboardContextValue | null>(null);

/** Estado do construtor de dashboard — inicializado com os dados já
 * resolvidos no servidor (primeira renderização) e depois re-resolvido no
 * cliente, um filtro por vez, sempre via
 * application/analytics/analyticsDataActions.ts::resolveWidgetsDataAction
 * (que só chama services/analytics/analyticsMetricsService.ts — nenhum
 * cálculo no cliente). Mudanças estruturais (adicionar/editar/excluir
 * widget) passam pelas Server Actions normais + router.refresh(), mesmo
 * padrão das fases anteriores; só os FILTROS são reativos sem reload. */
export function AnalyticsDashboardProvider({
  children,
  dashboardId,
  initialWidgets,
  initialWidgetsData,
  initialFilters,
}: {
  children: ReactNode;
  dashboardId: string;
  initialWidgets: AnalyticsWidget[];
  initialWidgetsData: AnalyticsWidgetData[];
  initialFilters: AnalyticsFilterState;
}) {
  const [filters, setFilters] = useState(initialFilters);
  const [widgetsData, setWidgetsData] = useState(initialWidgetsData);
  const [editMode, setEditMode] = useState(false);
  const [isPending, startTransition] = useTransition();

  const updateFilters = useCallback(
    (patch: Partial<AnalyticsFilterState>) => {
      const next = { ...filters, ...patch };
      setFilters(next);
      startTransition(async () => {
        const [data] = await Promise.all([
          resolveWidgetsDataAction(initialWidgets, next),
          saveDashboardFiltersAction(dashboardId, next),
        ]);
        setWidgetsData(data);
      });
    },
    [filters, initialWidgets, dashboardId],
  );

  const value = useMemo(
    () => ({
      dashboardId,
      widgets: initialWidgets,
      widgetsData,
      filters,
      isPending,
      editMode,
      setEditMode,
      updateFilters,
    }),
    [dashboardId, initialWidgets, widgetsData, filters, isPending, editMode, updateFilters],
  );

  return (
    <AnalyticsDashboardContext.Provider value={value}>
      {children}
    </AnalyticsDashboardContext.Provider>
  );
}

export function useAnalyticsDashboard() {
  const ctx = useContext(AnalyticsDashboardContext);
  if (!ctx)
    throw new Error("useAnalyticsDashboard deve ser usado dentro de AnalyticsDashboardProvider");
  return ctx;
}
