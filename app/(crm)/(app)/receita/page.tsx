import type { Metadata } from "next";
import { fetchRevenueForecastData } from "@/application/revenueIntelligence/revenueIntelligenceQueries";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { BarChart } from "@/components/dashboard-mock/primitives/charts";
import { IconAlertTriangle, IconClock, IconTarget, IconWallet } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Visão Geral — Revenue Intelligence — Brusync OS",
};

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function ReceitaVisaoGeralPage() {
  const data = await fetchRevenueForecastData();
  const { summary } = data;

  return (
    <div>
      <div className="crm-kpi-grid">
        <KpiCard
          label="Receita Prevista"
          value={formatCurrency(summary.predictedRevenue)}
          icon={IconTarget}
          hint="Pipeline aberto ponderado pela probabilidade histórica de cada etapa"
        />
        <KpiCard
          label="Receita Confirmada"
          value={formatCurrency(summary.confirmedRevenue)}
          icon={IconWallet}
          hint="Recebido de fato (Financeiro)"
        />
        <KpiCard
          label="Receita Perdida"
          value={formatCurrency(summary.lostRevenue)}
          icon={IconAlertTriangle}
          hint="Soma dos leads perdidos"
        />
        <KpiCard
          label="Ciclo médio de vendas"
          value={
            data.averageSalesCycleDays !== null
              ? `${data.averageSalesCycleDays.toFixed(0)} dias`
              : "—"
          }
          icon={IconClock}
        />
      </div>

      <div className="crm-fin-charts-row" style={{ marginTop: 20 }}>
        <div className="crm-card">
          <div className="crm-card-head">
            <div>
              <div className="crm-card-title">Forecast mensal</div>
              <p className="crm-card-sub">Próximos 6 meses</p>
            </div>
          </div>
          <div className="crm-card-pad">
            <BarChart
              bars={data.monthly.map((point) => ({ value: point.forecastValue, color: "#2563eb" }))}
              height={120}
            />
            <div className="crm-rev-chart-labels">
              {data.monthly.map((point) => (
                <span key={point.key}>{point.label}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="crm-card">
          <div className="crm-card-head">
            <div>
              <div className="crm-card-title">Forecast trimestral</div>
              <p className="crm-card-sub">Próximos 4 trimestres</p>
            </div>
          </div>
          <div className="crm-card-pad">
            <BarChart
              bars={data.quarterly.map((point) => ({
                value: point.forecastValue,
                color: "#0ea5e9",
              }))}
              height={120}
            />
            <div className="crm-rev-chart-labels">
              {data.quarterly.map((point) => (
                <span key={point.key}>{point.label}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="crm-card" style={{ marginTop: 20 }}>
        <div className="crm-card-head">
          <div>
            <div className="crm-card-title">Forecast anual</div>
            <p className="crm-card-sub">
              Estimado com base no ciclo médio de vendas — criação do lead + tempo médio histórico
              até fechar, aplicado ao valor ponderado do pipeline aberto.
            </p>
          </div>
        </div>
        <div className="crm-card-pad">
          <div className="crm-rev-annual-row">
            {data.annual.map((point) => (
              <div key={point.key} className="crm-rev-annual-cell">
                <span className="crm-kpi-label">{point.label}</span>
                <span className="crm-kpi-val">{formatCurrency(point.forecastValue)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="crm-card" style={{ marginTop: 20 }}>
        <div className="crm-card-head">
          <div className="crm-card-title">Pipeline por etapa</div>
        </div>
        <div className="crm-card-pad" style={{ overflowX: "auto" }}>
          <table className="crm-table">
            <thead>
              <tr>
                <th>Etapa</th>
                <th>Leads abertos</th>
                <th>Valor em aberto</th>
                <th>Probabilidade de ganho</th>
                <th>Valor ponderado</th>
              </tr>
            </thead>
            <tbody>
              {summary.byStage.map((row) => (
                <tr key={row.stage.id}>
                  <td>{row.stage.label}</td>
                  <td>{row.openCount}</td>
                  <td>{formatCurrency(row.openValue)}</td>
                  <td>{row.winProbability.toFixed(0)}%</td>
                  <td>{formatCurrency(row.weightedValue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
