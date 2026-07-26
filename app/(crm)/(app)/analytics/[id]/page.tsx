import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  fetchDashboardDetail,
  fetchSharesForDashboard,
  fetchSnapshotsForDashboard,
} from "@/application/analytics/analyticsQueries";
import { getOwnerOptions } from "@/application/crm/leadsQueries";
import { AnalyticsEditModeBar } from "@/components/analytics/AnalyticsEditModeBar";
import { AnalyticsExportMenu } from "@/components/analytics/AnalyticsExportMenu";
import { AnalyticsFilterBar } from "@/components/analytics/AnalyticsFilterBar";
import { AnalyticsSharePanel } from "@/components/analytics/AnalyticsSharePanel";
import { AnalyticsSnapshotPanel } from "@/components/analytics/AnalyticsSnapshotPanel";
import { AnalyticsWidgetEditorModal } from "@/components/analytics/AnalyticsWidgetEditorModal";
import { AnalyticsWidgetGrid } from "@/components/analytics/AnalyticsWidgetGrid";
import { AnalyticsDashboardProvider } from "@/contexts/analytics/AnalyticsDashboardContext";
import { AnalyticsWidgetEditorProvider } from "@/contexts/analytics/AnalyticsWidgetEditorContext";
import { resolveMetric } from "@/services/analytics/analyticsMetricsService";
import type { AnalyticsWidgetData } from "@/types/analytics";

export const metadata: Metadata = {
  title: "Dashboard — Analytics — Brusync OS",
};

export default async function AnalyticsDashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const dashboard = await fetchDashboardDetail(id);
  if (!dashboard) notFound();

  const [owners, shares, snapshots] = await Promise.all([
    getOwnerOptions(),
    fetchSharesForDashboard(id),
    fetchSnapshotsForDashboard(id),
  ]);

  const widgetsData: AnalyticsWidgetData[] = await Promise.all(
    dashboard.widgets.map(async (widget) => ({
      widget,
      result: await resolveMetric(widget.dataSource, widget.metric, dashboard.filters),
    })),
  );

  return (
    <AnalyticsWidgetEditorProvider>
      <AnalyticsDashboardProvider
        dashboardId={id}
        initialWidgets={dashboard.widgets}
        initialWidgetsData={widgetsData}
        initialFilters={dashboard.filters}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="crm-page-head" style={{ marginBottom: 0 }}>
            <div>
              <div className="crm-card-title">{dashboard.name}</div>
              {dashboard.description && <p className="crm-card-sub">{dashboard.description}</p>}
            </div>
            <AnalyticsExportMenu dashboardName={dashboard.name} />
          </div>

          <AnalyticsEditModeBar />
          <AnalyticsFilterBar owners={owners} />
          <AnalyticsWidgetGrid />

          <div className="crm-int-grid">
            <AnalyticsSharePanel dashboardId={id} shares={shares} />
            <AnalyticsSnapshotPanel dashboardId={id} snapshots={snapshots} />
          </div>
        </div>

        <AnalyticsWidgetEditorModal dashboardId={id} />
      </AnalyticsDashboardProvider>
    </AnalyticsWidgetEditorProvider>
  );
}
