import type { Metadata } from "next";
import { fetchRevenueCommercialData } from "@/application/revenueIntelligence/revenueIntelligenceQueries";
import type { ConversionDimension } from "@/types/revenueIntelligence";

export const metadata: Metadata = {
  title: "Comercial — Revenue Intelligence — Brusync OS",
};

const DIMENSION_LABEL: Record<ConversionDimension, string> = {
  vendedor: "Vendedor",
  campanha: "Campanha",
  origem: "Origem",
  cidade: "Cidade",
  canal: "Canal",
  periodo: "Período",
};

const DIMENSIONS: ConversionDimension[] = [
  "vendedor",
  "campanha",
  "origem",
  "cidade",
  "canal",
  "periodo",
];

export default async function ReceitaComercialPage() {
  const data = await fetchRevenueCommercialData();

  return (
    <div>
      <div className="crm-card">
        <div className="crm-card-head">
          <div>
            <div className="crm-card-title">Tempo médio por etapa do funil</div>
            <p className="crm-card-sub">
              Etapas realmente configuradas neste pipeline (novo → contato → qualificado → proposta
              → fechado)
              {data.averageProjectDeliveryDays !== null && (
                <>
                  {" "}
                  — entrega média de projeto após o fechamento:{" "}
                  {data.averageProjectDeliveryDays.toFixed(0)} dias.
                </>
              )}
            </p>
          </div>
        </div>
        <div className="crm-card-pad" style={{ overflowX: "auto" }}>
          <table className="crm-table">
            <thead>
              <tr>
                <th>Etapa</th>
                <th>Tempo médio</th>
                <th>Conversão da etapa anterior</th>
              </tr>
            </thead>
            <tbody>
              {data.stageCycle.map((row) => (
                <tr key={row.stageLabel}>
                  <td>{row.stageLabel}</td>
                  <td>{row.avgDays !== null ? `${row.avgDays.toFixed(1)} dias` : "—"}</td>
                  <td>
                    {row.conversionFromPrevious !== null
                      ? `${row.conversionFromPrevious.toFixed(1)}%`
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="crm-int-grid" style={{ marginTop: 20 }}>
        {DIMENSIONS.map((dimension) => (
          <div className="crm-card" key={dimension}>
            <div className="crm-card-head">
              <div className="crm-card-title">
                Conversão por {DIMENSION_LABEL[dimension].toLowerCase()}
              </div>
            </div>
            <div className="crm-card-pad" style={{ overflowX: "auto" }}>
              <table className="crm-table">
                <thead>
                  <tr>
                    <th>{DIMENSION_LABEL[dimension]}</th>
                    <th>Leads</th>
                    <th>Clientes</th>
                    <th>Conversão</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byDimension[dimension].map((row) => (
                    <tr key={row.label}>
                      <td>{row.label}</td>
                      <td>{row.leads}</td>
                      <td>{row.clients}</td>
                      <td>{row.conversionRate.toFixed(1)}%</td>
                    </tr>
                  ))}
                  {data.byDimension[dimension].length === 0 && (
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
        ))}
      </div>

      <p className="crm-card-sub" style={{ marginTop: 16 }}>
        Conversão por "segmento" e "serviço" não estão disponíveis: não existe hoje um campo de
        segmento de cliente nem de serviço/produto vendido em lead, cliente ou transação.
      </p>
    </div>
  );
}
