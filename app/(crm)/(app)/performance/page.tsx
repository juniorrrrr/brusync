import type { Metadata } from "next";
import { fetchPerformanceExecutiveData } from "@/application/performance/performanceQueries";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { GoalCard } from "@/components/performance/GoalCard";
import { PerformanceAlertCard } from "@/components/performance/PerformanceAlertCard";
import { IconChart, IconCheckCircle, IconTarget } from "@/components/ui/icons";
import type { ComparisonPoint } from "@/types/performance";

export const metadata: Metadata = {
  title: "Executivo — Performance — Brusync OS",
};

function formatChange(point: ComparisonPoint): string {
  if (point.changePercent === null) return "—";
  const sign = point.changePercent >= 0 ? "+" : "";
  return `${sign}${point.changePercent.toFixed(1)}%`;
}

function ComparisonCard({ point }: { point: ComparisonPoint }) {
  const isFavorable =
    point.changePercent === null
      ? null
      : point.favorableWhenHigher
        ? point.changePercent >= 0
        : point.changePercent <= 0;

  return (
    <div className="crm-card crm-card-pad">
      <div className="crm-card-sub">{point.label}</div>
      <div className="crm-kpi-val" style={{ marginTop: 4 }}>
        {point.currentValue.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}
      </div>
      <div
        className={`crm-badge ${isFavorable === null ? "neutral" : isFavorable ? "ok" : "danger"}`}
      >
        {formatChange(point)}
      </div>
    </div>
  );
}

export default async function PerformanceExecutivoPage() {
  const data = await fetchPerformanceExecutiveData();

  return (
    <div>
      <div className="crm-kpi-grid">
        <KpiCard
          label="% concluído (metas da empresa)"
          value={
            data.overallPercentComplete !== null
              ? `${data.overallPercentComplete.toFixed(0)}%`
              : "—"
          }
          icon={IconChart}
        />
        <KpiCard label="Metas ativas" value={data.companyGoals.length} icon={IconTarget} />
        <KpiCard
          label="Metas atingidas"
          value={
            data.companyGoals.filter(
              (g) => g.progressStatus === "atingida" || g.progressStatus === "superada",
            ).length
          }
          icon={IconCheckCircle}
        />
      </div>

      <div className="crm-fin-charts-row" style={{ marginTop: 20 }}>
        <ComparisonCard point={data.comparisons.revenue} />
        <ComparisonCard point={data.comparisons.leads} />
        <ComparisonCard point={data.comparisons.conversion} />
      </div>

      <div className="crm-card" style={{ marginTop: 20 }}>
        <div className="crm-card-head">
          <div className="crm-card-title">Metas da empresa</div>
        </div>
        <div className="crm-card-pad crm-int-grid">
          {data.companyGoals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
          {data.companyGoals.length === 0 && (
            <p className="crm-card-sub">Nenhuma meta de empresa cadastrada ainda.</p>
          )}
        </div>
      </div>

      <div className="crm-card" style={{ marginTop: 20 }}>
        <div className="crm-card-head">
          <div className="crm-card-title">Alertas</div>
        </div>
        <div className="crm-card-pad crm-int-grid">
          {data.alerts.map((alert) => (
            <PerformanceAlertCard key={alert.id} alert={alert} />
          ))}
          {data.alerts.length === 0 && <p className="crm-card-sub">Nenhum alerta no momento.</p>}
        </div>
      </div>
    </div>
  );
}
