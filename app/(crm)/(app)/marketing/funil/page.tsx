import type { Metadata } from "next";
import { parseMarketingFilters } from "@/application/marketingAnalytics/filters";
import { getMarketingFunnel } from "@/application/marketingAnalytics/funnelQueries";
import { formatCurrencyBRL, formatPercent } from "@/domain/crm/format";

export const metadata: Metadata = {
  title: "Marketing · Funil — Brusync OS",
  robots: { index: false, follow: false },
};

export default async function MarketingFunilPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const { filters } = parseMarketingFilters(params);
  const funnel = await getMarketingFunnel(filters);
  const max = Math.max(...funnel.stages.map((stage) => stage.count), 1);

  return (
    <div className="crm-card crm-card-pad reveal in">
      <div className="crm-card-head">
        <div>
          <div className="crm-card-title">Funil de Marketing</div>
          <div className="crm-card-sub">
            Leads → Qualificados → Propostas → Clientes · Receita{" "}
            {formatCurrencyBRL(funnel.totalRevenue)}
          </div>
        </div>
      </div>
      <div style={{ marginTop: 8 }}>
        {funnel.stages.map((stage) => (
          <div key={stage.key} className="crm-funnel-row">
            <span className="crm-funnel-label">{stage.label}</span>
            <span className="crm-funnel-track">
              <span
                className="crm-funnel-fill"
                style={{ width: `${Math.max(4, (stage.count / max) * 100)}%` }}
              />
            </span>
            <span className="crm-funnel-count">
              {stage.count}
              {stage.conversionFromPrevious !== null && (
                <span className="cell-muted" style={{ marginLeft: 6, fontSize: 11 }}>
                  ({formatPercent(stage.conversionFromPrevious)})
                </span>
              )}
            </span>
          </div>
        ))}
      </div>
      <p className="crm-card-sub" style={{ marginTop: 16 }}>
        "Visitantes" ainda não é a primeira etapa aqui — depende de uma futura integração de
        tracking de pageview/GA4, que ainda não existe no servidor.
      </p>
    </div>
  );
}
