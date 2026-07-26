import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchSharedDashboard } from "@/application/analytics/analyticsQueries";
import { AnalyticsWidgetCard } from "@/components/analytics/AnalyticsWidgetCard";
import { resolveMetric } from "@/services/analytics/analyticsMetricsService";
import type { AnalyticsWidgetData } from "@/types/analytics";

export const metadata: Metadata = {
  title: "Dashboard compartilhado — Analytics — Brusync OS",
};

export default async function AnalyticsSharedDashboardPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const dashboard = await fetchSharedDashboard(token);
  if (!dashboard) notFound();

  const widgetsData: AnalyticsWidgetData[] = await Promise.all(
    dashboard.widgets.map(async (widget) => ({
      widget,
      result: await resolveMetric(widget.dataSource, widget.metric, dashboard.filters),
    })),
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="crm-page-head" style={{ marginBottom: 0 }}>
        <div>
          <div className="crm-card-title">{dashboard.name}</div>
          <p className="crm-card-sub">Somente leitura — compartilhado internamente.</p>
        </div>
      </div>

      <div className="crm-an-grid">
        {widgetsData.map((data) => (
          <AnalyticsWidgetCard key={data.widget.id} data={data} editMode={false} />
        ))}
      </div>
    </div>
  );
}
