"use client";

import { AnalyticsWidgetCard } from "@/components/analytics/AnalyticsWidgetCard";
import { useAnalyticsDashboard } from "@/contexts/analytics/AnalyticsDashboardContext";

export function AnalyticsWidgetGrid() {
  const { widgetsData, editMode, isPending } = useAnalyticsDashboard();

  if (widgetsData.length === 0) {
    return (
      <div className="crm-card crm-card-pad">
        <p className="crm-card-sub">
          Nenhum widget neste dashboard ainda. Use "Adicionar widget" para começar.
        </p>
      </div>
    );
  }

  return (
    <div className={`crm-an-grid${isPending ? " crm-an-grid-loading" : ""}`}>
      {widgetsData.map((data) => (
        <AnalyticsWidgetCard key={data.widget.id} data={data} editMode={editMode} />
      ))}
    </div>
  );
}
