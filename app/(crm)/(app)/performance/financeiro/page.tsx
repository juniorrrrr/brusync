import type { Metadata } from "next";
import { fetchPerformanceFinancialData } from "@/application/performance/performanceQueries";
import { GoalCard } from "@/components/performance/GoalCard";
import { PerformanceAlertCard } from "@/components/performance/PerformanceAlertCard";

export const metadata: Metadata = {
  title: "Financeiro — Performance — Brusync OS",
};

export default async function PerformanceFinanceiroPage() {
  const data = await fetchPerformanceFinancialData();

  return (
    <div>
      <div className="crm-card">
        <div className="crm-card-head">
          <div className="crm-card-title">Metas financeiras</div>
        </div>
        <div className="crm-card-pad crm-int-grid">
          {data.goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
          {data.goals.length === 0 && (
            <p className="crm-card-sub">Nenhuma meta financeira cadastrada ainda.</p>
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
