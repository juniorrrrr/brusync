import type { Metadata } from "next";
import { getCreativeRows } from "@/application/marketingAnalytics/creativesQueries";
import { parseMarketingFilters } from "@/application/marketingAnalytics/filters";
import { NoResults } from "@/components/crm/NoResults";
import { IconPaperclip } from "@/components/ui/icons";
import { formatCurrencyBRL, formatPercent } from "@/domain/crm/format";

export const metadata: Metadata = {
  title: "Marketing · Criativos — Brusync OS",
  robots: { index: false, follow: false },
};

export default async function MarketingCriativosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const { filters } = parseMarketingFilters(params);
  const rows = await getCreativeRows(filters);

  return (
    <div className="crm-card">
      {rows.length === 0 ? (
        <NoResults
          icon={IconPaperclip}
          title="Nenhum criativo encontrado"
          description="Leads com fbclid, gclid, msclkid ou ttclid aparecerão aqui, agrupados por utm_content (Criativo) e utm_term (Conjunto) — um proxy via UTM até existir integração real com as APIs de anúncios."
        />
      ) : (
        <div className="crm-table-wrap">
          <table className="crm-table">
            <thead>
              <tr>
                <th>Criativo</th>
                <th>Conjunto</th>
                <th>Campanha</th>
                <th>Leads</th>
                <th>Clientes</th>
                <th>Receita</th>
                <th>Conversão</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key}>
                  <td className="cell-strong">{row.utmContent || "(não informado)"}</td>
                  <td className="cell-muted">{row.utmTerm || "—"}</td>
                  <td className="cell-muted">{row.utmCampaign || "—"}</td>
                  <td>{row.leads}</td>
                  <td>{row.clients}</td>
                  <td className="cell-muted">{formatCurrencyBRL(row.revenue)}</td>
                  <td className="cell-muted">{formatPercent(row.conversionRate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
