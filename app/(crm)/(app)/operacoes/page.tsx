import type { Metadata } from "next";
import { fetchOperationsDashboardData } from "@/application/operations/operationsDashboardQueries";
import { OperationsAgendaWidget } from "@/components/operations/OperationsAgendaWidget";
import { OperationsAlertsWidget } from "@/components/operations/OperationsAlertsWidget";
import { OperationsCardsGrid } from "@/components/operations/OperationsCardsGrid";
import { OperationsFavoritesPanel } from "@/components/operations/OperationsFavoritesPanel";
import { OperationsFeed } from "@/components/operations/OperationsFeed";
import { OperationsFinancialWidget } from "@/components/operations/OperationsFinancialWidget";
import { OperationsGlobalSearch } from "@/components/operations/OperationsGlobalSearch";
import { OperationsInsightsWidget } from "@/components/operations/OperationsInsightsWidget";
import { OperationsMarketingWidget } from "@/components/operations/OperationsMarketingWidget";
import { OperationsModuleHealthGrid } from "@/components/operations/OperationsModuleHealthGrid";
import { OperationsNextActionsPanel } from "@/components/operations/OperationsNextActionsPanel";
import { OperationsProjectsWidget } from "@/components/operations/OperationsProjectsWidget";
import { OperationsQueuePanel } from "@/components/operations/OperationsQueuePanel";
import { OperationsTimeline } from "@/components/operations/OperationsTimeline";
import { OperationsWidgetSection } from "@/components/operations/OperationsWidgetSection";
import { OperationsWidgetSettings } from "@/components/operations/OperationsWidgetSettings";
import { OperationsLayoutProvider } from "@/contexts/operations/OperationsLayoutContext";

export const metadata: Metadata = {
  title: "Central de Operações — Brusync OS",
};

export default async function OperacoesPage() {
  const data = await fetchOperationsDashboardData("hoje");

  return (
    <OperationsLayoutProvider initialLayout={data.layout}>
      <div>
        <div className="crm-card-head">
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--primary)" }}>
              Central de Operações
            </h1>
            <p className="crm-card-sub" style={{ marginTop: 4 }}>
              O que precisa da sua atenção agora.
            </p>
          </div>
          <OperationsWidgetSettings />
        </div>

        <div style={{ marginTop: 16 }}>
          <OperationsGlobalSearch />
        </div>

        {data.favorites.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <OperationsFavoritesPanel favorites={data.favorites} />
          </div>
        )}

        <OperationsWidgetSection widgetKey="kpis">
          <OperationsCardsGrid cards={data.cards} />
        </OperationsWidgetSection>

        <div className="crm-fin-charts-row">
          <OperationsWidgetSection widgetKey="alertas">
            <OperationsAlertsWidget alerts={data.criticalAlerts} />
          </OperationsWidgetSection>
          <OperationsWidgetSection widgetKey="pendencias">
            <OperationsQueuePanel queue={data.queue} />
          </OperationsWidgetSection>
        </div>

        <div className="crm-fin-charts-row">
          <OperationsWidgetSection widgetKey="agenda">
            <OperationsAgendaWidget events={data.agendaToday} />
          </OperationsWidgetSection>
          <OperationsWidgetSection widgetKey="insights">
            <OperationsInsightsWidget insights={data.newInsights} />
          </OperationsWidgetSection>
        </div>

        <OperationsWidgetSection widgetKey="pendencias">
          <OperationsNextActionsPanel actions={data.nextActions} />
        </OperationsWidgetSection>

        <div className="crm-fin-charts-row">
          <OperationsWidgetSection widgetKey="feed">
            <OperationsFeed feed={data.feed} />
          </OperationsWidgetSection>
          <OperationsWidgetSection widgetKey="timeline">
            <OperationsTimeline timeline={data.timeline} />
          </OperationsWidgetSection>
        </div>

        <div className="crm-ops-card-grid" style={{ marginTop: 20 }}>
          <OperationsWidgetSection widgetKey="financeiro">
            <OperationsFinancialWidget snapshot={data.financialSnapshot} />
          </OperationsWidgetSection>
          <OperationsWidgetSection widgetKey="marketing">
            <OperationsMarketingWidget snapshot={data.marketingSnapshot} />
          </OperationsWidgetSection>
          <OperationsWidgetSection widgetKey="projetos">
            <OperationsProjectsWidget snapshot={data.projectsSnapshot} />
          </OperationsWidgetSection>
        </div>

        <div style={{ marginTop: 20 }}>
          <OperationsModuleHealthGrid modules={data.moduleHealth} />
        </div>
      </div>
    </OperationsLayoutProvider>
  );
}
