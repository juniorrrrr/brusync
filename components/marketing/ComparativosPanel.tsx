import type { ExecutiveComparison } from "@/application/marketingAnalytics/comparisonQueries";
import { formatCurrencyBRL, formatPercent } from "@/domain/crm/format";
import { formatSignedPercent } from "@/domain/marketing/format";
import { PERIOD_LABEL } from "@/domain/marketing/period";

function ChangeBadge({ change }: { change: number | null }) {
  if (change === null) return <span className="crm-badge neutral">Sem comparação</span>;
  const tone = change >= 0 ? "ok" : "danger";
  return <span className={`crm-badge ${tone}`}>{formatSignedPercent(change)}</span>;
}

export function ComparativosPanel({ comparison }: { comparison: ExecutiveComparison }) {
  return (
    <div className="crm-card crm-card-pad reveal in">
      <div className="crm-card-head">
        <div>
          <div className="crm-card-title">Comparativos</div>
          <div className="crm-card-sub">
            {PERIOD_LABEL[comparison.preset]} vs. período anterior de igual duração
          </div>
        </div>
      </div>
      <div className="crm-mkt-compare-grid">
        <div className="crm-mkt-compare-row">
          <span>Receita</span>
          <strong>{formatCurrencyBRL(comparison.current.totalRevenue)}</strong>
          <ChangeBadge change={comparison.changes.totalRevenue} />
        </div>
        <div className="crm-mkt-compare-row">
          <span>Leads</span>
          <strong>{comparison.current.leadsCount}</strong>
          <ChangeBadge change={comparison.changes.leadsCount} />
        </div>
        <div className="crm-mkt-compare-row">
          <span>Clientes</span>
          <strong>{comparison.current.clientsCount}</strong>
          <ChangeBadge change={comparison.changes.clientsCount} />
        </div>
        <div className="crm-mkt-compare-row">
          <span>Conversão</span>
          <strong>{formatPercent(comparison.current.conversionRate)}</strong>
          <ChangeBadge change={comparison.changes.conversionRate} />
        </div>
      </div>
    </div>
  );
}
