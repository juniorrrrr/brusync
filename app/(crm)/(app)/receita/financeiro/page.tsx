import type { Metadata } from "next";
import { fetchRevenueFinancialData } from "@/application/revenueIntelligence/revenueIntelligenceQueries";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { LineChart } from "@/components/dashboard-mock/primitives/charts";
import {
  IconAlertTriangle,
  IconChart,
  IconClock,
  IconTag,
  IconTarget,
  IconWallet,
} from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Financeiro — Revenue Intelligence — Brusync OS",
};

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function metricLabel(value: number | null, available: boolean, suffix = ""): string {
  return available && value !== null ? `${value.toFixed(1)}${suffix}` : "—";
}

function buildLinePath(values: number[], height: number): string {
  if (values.length === 0) return "";
  const max = Math.max(...values, 1);
  const step = 300 / Math.max(values.length - 1, 1);
  return values
    .map((value, index) => {
      const x = index * step;
      const y = height - (value / max) * (height - 8) - 4;
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

export default async function ReceitaFinanceiroPage() {
  const data = await fetchRevenueFinancialData();
  const { kpis } = data;

  return (
    <div>
      <div className="crm-kpi-grid">
        <KpiCard
          label="CAC"
          value={kpis.cac.available ? formatCurrency(kpis.cac.value ?? 0) : "—"}
          icon={IconTarget}
        />
        <KpiCard
          label="ROI"
          value={
            kpis.roi.available && kpis.roi.value !== null
              ? `${(kpis.roi.value * 100).toFixed(1)}%`
              : "—"
          }
          icon={IconChart}
        />
        <KpiCard
          label="ROAS"
          value={metricLabel(kpis.roas.value, kpis.roas.available, "x")}
          icon={IconChart}
        />
        <KpiCard
          label="LTV"
          value={kpis.ltv !== null ? formatCurrency(kpis.ltv) : "—"}
          icon={IconWallet}
          hint="Receita paga acumulada média por cliente"
        />
        <KpiCard
          label="Payback"
          value={
            kpis.paybackInAverageSales !== null
              ? `${kpis.paybackInAverageSales.toFixed(1)} vendas`
              : "—"
          }
          icon={IconClock}
          hint="Nº de vendas médias para recuperar o CAC"
        />
        <KpiCard label="Ticket médio" value={formatCurrency(kpis.averageTicket)} icon={IconTag} />
        <KpiCard
          label="Receita prevista"
          value={formatCurrency(kpis.predictedRevenue)}
          icon={IconTarget}
        />
        <KpiCard
          label="Receita confirmada"
          value={formatCurrency(kpis.confirmedRevenue)}
          icon={IconWallet}
        />
        <KpiCard
          label="Receita perdida"
          value={formatCurrency(kpis.lostRevenue)}
          icon={IconAlertTriangle}
        />
        <KpiCard
          label="Margem"
          value={kpis.margin !== null ? `${kpis.margin.toFixed(1)}%` : "—"}
          icon={IconChart}
        />
      </div>

      <div className="crm-card" style={{ marginTop: 20 }}>
        <div className="crm-card-head">
          <div>
            <div className="crm-card-title">Receita x Despesa — últimos 6 meses</div>
          </div>
        </div>
        <div className="crm-card-pad">
          <LineChart
            d={buildLinePath(
              data.monthlySeries.map((point) => point.revenue),
              92,
            )}
            color="#16a34a"
          />
          <div className="crm-rev-chart-labels">
            {data.monthlySeries.map((point) => (
              <span key={point.month}>{point.label}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
