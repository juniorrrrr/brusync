import type { Metadata } from "next";
import { fetchRevenueAlertsData } from "@/application/revenueIntelligence/revenueIntelligenceQueries";
import { IntelligenceAlertCard } from "@/components/intelligence/IntelligenceAlertCard";
import { RevenueInsightCard } from "@/components/revenueIntelligence/RevenueInsightCard";

export const metadata: Metadata = {
  title: "Alertas & Insights — Revenue Intelligence — Brusync OS",
};

export default async function ReceitaAlertasPage() {
  const data = await fetchRevenueAlertsData();

  return (
    <div>
      <div className="crm-card">
        <div className="crm-card-head">
          <div>
            <div className="crm-card-title">Insights automáticos</div>
            <p className="crm-card-sub">Todo insight tem evidência — nada é gerado ao acaso.</p>
          </div>
        </div>
        <div className="crm-card-pad crm-int-grid">
          {data.insights.map((insight) => (
            <RevenueInsightCard key={insight.id} insight={insight} />
          ))}
          {data.insights.length === 0 && (
            <p className="crm-card-sub">Nenhum padrão relevante detectado no período atual.</p>
          )}
        </div>
      </div>

      <div className="crm-card" style={{ marginTop: 20 }}>
        <div className="crm-card-head">
          <div className="crm-card-title">Alertas operacionais (Central de Inteligência)</div>
        </div>
        <div className="crm-card-pad crm-int-grid">
          {data.reusedAlerts.map((alert) => (
            <IntelligenceAlertCard key={alert.id} alert={alert} />
          ))}
          {data.reusedAlerts.length === 0 && (
            <p className="crm-card-sub">
              Nenhum alerta comercial, de marketing ou financeiro ativo.
            </p>
          )}
        </div>
      </div>

      <div className="crm-fin-charts-row" style={{ marginTop: 20 }}>
        <div className="crm-card">
          <div className="crm-card-head">
            <div className="crm-card-title">Clientes sem contato recente</div>
          </div>
          <div className="crm-card-pad" style={{ overflowX: "auto" }}>
            <table className="crm-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Último contato</th>
                  <th>Dias sem contato</th>
                </tr>
              </thead>
              <tbody>
                {data.clientsWithoutContact.map((row) => (
                  <tr key={row.clientId}>
                    <td>{row.clientCompany}</td>
                    <td>
                      {row.lastMessageAt
                        ? new Date(row.lastMessageAt).toLocaleDateString("pt-BR")
                        : "Nunca"}
                    </td>
                    <td>{row.daysSinceContact}</td>
                  </tr>
                ))}
                {data.clientsWithoutContact.length === 0 && (
                  <tr>
                    <td colSpan={3} className="crm-empty">
                      Todos os clientes ativos tiveram contato recente.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="crm-card">
          <div className="crm-card-head">
            <div className="crm-card-title">Conversão fora da média</div>
          </div>
          <div className="crm-card-pad" style={{ overflowX: "auto" }}>
            <table className="crm-table">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Nome</th>
                  <th>Conversão</th>
                  <th>Média do grupo</th>
                </tr>
              </thead>
              <tbody>
                {data.conversionOutliers.map((row) => (
                  <tr key={`${row.dimension}-${row.label}`}>
                    <td>{row.dimension === "vendedor" ? "Vendedor" : "Campanha"}</td>
                    <td>{row.label}</td>
                    <td>{row.conversionRate.toFixed(1)}%</td>
                    <td>
                      {row.direction === "acima" ? "▲" : "▼"} {row.averageConversionRate.toFixed(1)}
                      %
                    </td>
                  </tr>
                ))}
                {data.conversionOutliers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="crm-empty">
                      Nenhum desvio relevante encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
