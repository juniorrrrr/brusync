import type { Metadata } from "next";
import { getExecutiveComparison } from "@/application/marketingAnalytics/comparisonQueries";
import { getExecutiveMetrics } from "@/application/marketingAnalytics/executiveQueries";
import { parseMarketingFilters } from "@/application/marketingAnalytics/filters";
import { getMarketingTimeSeries } from "@/application/marketingAnalytics/timeSeriesQueries";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { LineChart } from "@/components/dashboard-mock/primitives/charts";
import { ComparativosPanel } from "@/components/marketing/ComparativosPanel";
import { MetricValue } from "@/components/marketing/MetricValue";
import {
  IconBuilding,
  IconChart,
  IconCheckCircle,
  IconClock,
  IconFunnel,
  IconReport,
  IconTarget,
  IconUsers,
  IconWallet,
} from "@/components/ui/icons";
import { formatCurrencyBRL, formatPercent } from "@/domain/crm/format";
import { buildSparklinePath } from "@/domain/crm/sparkline";
import {
  formatDays,
  formatMetric,
  formatRoas,
  formatSignedPercent,
} from "@/domain/marketing/format";

export const metadata: Metadata = {
  title: "Marketing Executivo — Brusync OS",
  robots: { index: false, follow: false },
};

export default async function MarketingExecutivoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const { preset, filters } = parseMarketingFilters(params);

  const [metrics, comparison, timeSeries] = await Promise.all([
    getExecutiveMetrics(filters),
    getExecutiveComparison(preset),
    getMarketingTimeSeries(filters),
  ]);

  const leadsPath = buildSparklinePath(
    timeSeries.map((point) => point.leads),
    120,
  );

  return (
    <div>
      <div className="crm-kpi-grid">
        <KpiCard
          label="Investimento Total"
          value={
            <MetricValue
              available={metrics.totalInvestment.available}
              formatted={formatMetric(metrics.totalInvestment, formatCurrencyBRL)}
            />
          }
          icon={IconWallet}
        />
        <KpiCard label="Receita" value={formatCurrencyBRL(metrics.totalRevenue)} icon={IconChart} />
        <KpiCard
          label="ROAS"
          value={
            <MetricValue
              available={metrics.roas.available}
              formatted={formatMetric(metrics.roas, formatRoas)}
            />
          }
          icon={IconTarget}
        />
        <KpiCard
          label="ROI"
          value={
            <MetricValue
              available={metrics.roi.available}
              formatted={formatMetric(metrics.roi, (v) => formatSignedPercent(v))}
            />
          }
          icon={IconReport}
        />
        <KpiCard
          label="CAC"
          value={
            <MetricValue
              available={metrics.cac.available}
              formatted={formatMetric(metrics.cac, formatCurrencyBRL)}
            />
          }
          icon={IconUsers}
        />
        <KpiCard label="Leads" value={String(metrics.leadsCount)} icon={IconTarget} />
        <KpiCard
          label="Leads Qualificados"
          value={String(metrics.qualifiedLeadsCount)}
          icon={IconCheckCircle}
        />
        <KpiCard label="Clientes" value={String(metrics.clientsCount)} icon={IconBuilding} />
        <KpiCard
          label="Ticket Médio"
          value={metrics.averageTicket !== null ? formatCurrencyBRL(metrics.averageTicket) : "—"}
          icon={IconWallet}
        />
        <KpiCard
          label="Taxa de Conversão"
          value={formatPercent(metrics.conversionRate)}
          icon={IconFunnel}
        />
        <KpiCard
          label="Tempo Médio até Venda"
          value={
            metrics.averageTimeToWinDays !== null ? formatDays(metrics.averageTimeToWinDays) : "—"
          }
          icon={IconClock}
        />
      </div>

      <div className="crm-row">
        <div className="crm-card crm-card-pad reveal in">
          <div className="crm-card-head">
            <div>
              <div className="crm-card-title">Leads no período</div>
              <div className="crm-card-sub">{metrics.leadsCount} leads capturados</div>
            </div>
          </div>
          <div className="crm-chart-wrap">
            <LineChart d={leadsPath} color="var(--secondary)" height={120} />
          </div>
        </div>
        <ComparativosPanel comparison={comparison} />
      </div>
    </div>
  );
}
