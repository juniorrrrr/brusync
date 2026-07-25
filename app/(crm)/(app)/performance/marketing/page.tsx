import type { Metadata } from "next";
import { fetchPerformanceMarketingData } from "@/application/performance/performanceQueries";
import { GoalCard } from "@/components/performance/GoalCard";
import { PerformanceAlertCard } from "@/components/performance/PerformanceAlertCard";
import type { PerformanceRankingRow } from "@/types/performance";

export const metadata: Metadata = {
  title: "Marketing — Performance — Brusync OS",
};

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function RankingTable({ title, rows }: { title: string; rows: PerformanceRankingRow[] }) {
  return (
    <div className="crm-card">
      <div className="crm-card-head">
        <div className="crm-card-title">{title}</div>
      </div>
      <div className="crm-card-pad" style={{ overflowX: "auto" }}>
        <table className="crm-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Nome</th>
              <th>Receita</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.label}>
                <td>{index + 1}</td>
                <td>{row.label}</td>
                <td>{formatCurrency(row.value)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={3} className="crm-empty">
                  Sem dados suficientes.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default async function PerformanceMarketingPage() {
  const data = await fetchPerformanceMarketingData();

  return (
    <div>
      <div className="crm-card">
        <div className="crm-card-head">
          <div className="crm-card-title">Metas de marketing</div>
        </div>
        <div className="crm-card-pad crm-int-grid">
          {data.goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
          {data.goals.length === 0 && (
            <p className="crm-card-sub">Nenhuma meta de marketing cadastrada ainda.</p>
          )}
        </div>
      </div>

      <div className="crm-fin-charts-row" style={{ marginTop: 20 }}>
        <RankingTable title="Top campanhas" rows={data.topCampaigns} />
        <RankingTable title="Top canais" rows={data.topChannels} />
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
