import type { Metadata } from "next";
import { fetchPerformanceCommercialData } from "@/application/performance/performanceQueries";
import { GoalCard } from "@/components/performance/GoalCard";
import { PerformanceAlertCard } from "@/components/performance/PerformanceAlertCard";

export const metadata: Metadata = {
  title: "Comercial — Performance — Brusync OS",
};

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function PerformanceComercialPage() {
  const data = await fetchPerformanceCommercialData();

  return (
    <div>
      <div className="crm-card">
        <div className="crm-card-head">
          <div className="crm-card-title">Metas comerciais</div>
        </div>
        <div className="crm-card-pad crm-int-grid">
          {data.goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
          {data.goals.length === 0 && (
            <p className="crm-card-sub">Nenhuma meta comercial cadastrada ainda.</p>
          )}
        </div>
      </div>

      <div className="crm-card" style={{ marginTop: 20 }}>
        <div className="crm-card-head">
          <div className="crm-card-title">Top vendedores</div>
        </div>
        <div className="crm-card-pad" style={{ overflowX: "auto" }}>
          <table className="crm-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Vendedor</th>
                <th>Receita</th>
                <th>Taxa de vitória</th>
              </tr>
            </thead>
            <tbody>
              {data.topSellers.map((row, index) => (
                <tr key={row.label}>
                  <td>{index + 1}</td>
                  <td>{row.label}</td>
                  <td>{formatCurrency(row.value)}</td>
                  <td>{row.secondaryValue !== null ? `${row.secondaryValue.toFixed(1)}%` : "—"}</td>
                </tr>
              ))}
              {data.topSellers.length === 0 && (
                <tr>
                  <td colSpan={4} className="crm-empty">
                    Sem dados suficientes.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
