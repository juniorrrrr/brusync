import type { Metadata } from "next";
import { fetchIntelligenceDashboardData } from "@/application/intelligence/intelligenceDashboardQueries";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { IntelligenceAlertsPanel } from "@/components/intelligence/IntelligenceAlertsPanel";
import { IntelligenceFeed } from "@/components/intelligence/IntelligenceFeed";
import { IntelligenceInsightsPanel } from "@/components/intelligence/IntelligenceInsightsPanel";
import { IntelligencePeriodSelector } from "@/components/intelligence/IntelligencePeriodSelector";
import { IntelligenceRecommendationsPanel } from "@/components/intelligence/IntelligenceRecommendationsPanel";
import { IntelligenceScoresGrid } from "@/components/intelligence/IntelligenceScoresGrid";
import { IntelligenceTrendsPanel } from "@/components/intelligence/IntelligenceTrendsPanel";
import { IconAlertTriangle, IconBell, IconChart } from "@/components/ui/icons";
import type { IntelligencePeriodKey } from "@/types/intelligence";

export const metadata: Metadata = {
  title: "Central de Inteligência — Brusync OS",
};

export default async function InteligenciaPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const period = (params.period as IntelligencePeriodKey) || "30d";
  const custom =
    period === "personalizado" && params.from && params.to
      ? { from: params.from, to: params.to }
      : undefined;

  const data = await fetchIntelligenceDashboardData(period, custom);

  return (
    <div>
      <div className="crm-card-head">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--primary)" }}>
            Central de Inteligência
          </h1>
          <p className="crm-card-sub" style={{ marginTop: 4 }}>
            Insights, alertas e scores derivados automaticamente dos dados reais da operação — sem
            IA generativa.
          </p>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <IntelligencePeriodSelector />
      </div>

      <div className="crm-kpi-grid" style={{ marginTop: 16 }}>
        <KpiCard label="Insights ativos" value={data.insightsCount} icon={IconChart} />
        <KpiCard label="Alertas ativos" value={data.activeAlertsCount} icon={IconBell} />
        <KpiCard
          label="Alertas críticos"
          value={data.criticalAlertsCount}
          icon={IconAlertTriangle}
        />
        <KpiCard label="Score geral" value={data.scores.geral.score} icon={IconChart} />
      </div>

      <div style={{ marginTop: 20 }}>
        <IntelligenceScoresGrid scores={data.scores} />
      </div>

      <div className="crm-fin-charts-row" style={{ marginTop: 20 }}>
        <IntelligenceAlertsPanel alerts={data.alerts} />
        <IntelligenceTrendsPanel trends={data.trends} />
      </div>

      <div style={{ marginTop: 16 }}>
        <IntelligenceInsightsPanel insights={data.insights} />
      </div>

      <div className="crm-fin-charts-row" style={{ marginTop: 16 }}>
        <IntelligenceRecommendationsPanel recommendations={data.recommendations} />
        <IntelligenceFeed feed={data.feed} insights={data.insights} alerts={data.alerts} />
      </div>
    </div>
  );
}
