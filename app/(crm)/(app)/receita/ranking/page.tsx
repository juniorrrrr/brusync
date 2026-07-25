import type { Metadata } from "next";
import { fetchRevenueRankingsData } from "@/application/revenueIntelligence/revenueIntelligenceQueries";
import type { RankingRow } from "@/types/revenueIntelligence";

export const metadata: Metadata = {
  title: "Ranking — Revenue Intelligence — Brusync OS",
};

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function RankingTable({ title, rows }: { title: string; rows: RankingRow[] }) {
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
              <th>{rows[0]?.secondaryLabel ?? "Secundário"}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.label}>
                <td>{index + 1}</td>
                <td>{row.label}</td>
                <td>{formatCurrency(row.revenue)}</td>
                <td>{row.secondaryValue !== null ? `${row.secondaryValue.toFixed(1)}%` : "—"}</td>
              </tr>
            ))}
            {rows.length === 0 && (
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
  );
}

export default async function ReceitaRankingPage() {
  const data = await fetchRevenueRankingsData();

  return (
    <div className="crm-int-grid">
      <RankingTable title="Top vendedores" rows={data.topSellers} />
      <RankingTable title="Top campanhas" rows={data.topCampaigns} />
      <RankingTable title="Top canais" rows={data.topChannels} />
      <RankingTable title="Top cidades" rows={data.topCities} />
      <RankingTable title="Top clientes" rows={data.topClients} />
      <RankingTable title="Top fontes" rows={data.topSources} />
    </div>
  );
}
