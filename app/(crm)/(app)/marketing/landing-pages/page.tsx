import type { Metadata } from "next";
import { parseMarketingFilters } from "@/application/marketingAnalytics/filters";
import { getLandingPageRows } from "@/application/marketingAnalytics/landingPagesQueries";
import { NoResults } from "@/components/crm/NoResults";
import { IconDoc } from "@/components/ui/icons";
import { formatCurrencyBRL, formatPercent } from "@/domain/crm/format";
import { formatDays, truncateUrl } from "@/domain/marketing/format";

export const metadata: Metadata = {
  title: "Marketing · Landing Pages — Brusync OS",
  robots: { index: false, follow: false },
};

export default async function MarketingLandingPagesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const { filters } = parseMarketingFilters(params);
  const rows = await getLandingPageRows(filters);

  return (
    <div className="crm-card">
      {rows.length === 0 ? (
        <NoResults
          icon={IconDoc}
          title="Nenhuma landing page encontrada"
          description="Assim que leads chegarem com landing_page registrada, elas aparecem aqui."
        />
      ) : (
        <div className="crm-table-wrap">
          <table className="crm-table">
            <thead>
              <tr>
                <th>Landing</th>
                <th>Leads</th>
                <th>Clientes</th>
                <th>Receita</th>
                <th>Conversão</th>
                <th>Tempo Médio</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.landingPage}>
                  <td className="cell-strong" title={row.landingPage}>
                    {truncateUrl(row.landingPage)}
                  </td>
                  <td>{row.leads}</td>
                  <td>{row.clients}</td>
                  <td className="cell-muted">{formatCurrencyBRL(row.revenue)}</td>
                  <td className="cell-muted">{formatPercent(row.conversionRate)}</td>
                  <td className="cell-muted">
                    {row.averageTimeToConvertDays !== null
                      ? formatDays(row.averageTimeToConvertDays)
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
