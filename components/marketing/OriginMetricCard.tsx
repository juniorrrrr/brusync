import { MetricValue } from "@/components/marketing/MetricValue";
import { formatCurrencyBRL, formatPercent } from "@/domain/crm/format";
import { formatMetric, formatRoas } from "@/domain/marketing/format";
import type { OriginMetrics } from "@/types/marketing";

export function OriginMetricCard({ origin }: { origin: OriginMetrics }) {
  return (
    <div className="crm-card crm-card-pad reveal in">
      <div className="crm-card-head">
        <div className="crm-card-title">{origin.label}</div>
      </div>
      <div className="crm-mkt-origin-stats">
        <div className="crm-mkt-origin-stat">
          <span className="crm-card-sub">Leads</span>
          <strong>{origin.leads}</strong>
        </div>
        <div className="crm-mkt-origin-stat">
          <span className="crm-card-sub">Clientes</span>
          <strong>{origin.clients}</strong>
        </div>
        <div className="crm-mkt-origin-stat">
          <span className="crm-card-sub">Receita</span>
          <strong>{formatCurrencyBRL(origin.revenue)}</strong>
        </div>
        <div className="crm-mkt-origin-stat">
          <span className="crm-card-sub">Conversão</span>
          <strong>{formatPercent(origin.conversionRate)}</strong>
        </div>
        <div className="crm-mkt-origin-stat">
          <span className="crm-card-sub">ROAS</span>
          <strong>
            <MetricValue
              available={origin.roas.available}
              formatted={formatMetric(origin.roas, formatRoas)}
            />
          </strong>
        </div>
      </div>
    </div>
  );
}
