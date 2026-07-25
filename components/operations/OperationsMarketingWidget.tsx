import Link from "next/link";
import type { OperationsMarketingSnapshot } from "@/types/operations";

function brl(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function OperationsMarketingWidget({ snapshot }: { snapshot: OperationsMarketingSnapshot }) {
  return (
    <div className="crm-card crm-card-pad reveal in">
      <div className="crm-card-head">
        <div>
          <div className="crm-card-title">Saúde de marketing</div>
        </div>
        <Link href="/marketing" className="btn btn-outline">
          Ver marketing
        </Link>
      </div>
      <div className="crm-info-list" style={{ marginTop: 8 }}>
        <div className="crm-info-row">
          <span className="crm-info-row-label">Leads este mês</span>
          <span className="crm-info-row-value">{snapshot.leadsCount}</span>
        </div>
        <div className="crm-info-row">
          <span className="crm-info-row-label">Taxa de conversão</span>
          <span className="crm-info-row-value">{snapshot.conversionRate.toFixed(1)}%</span>
        </div>
        <div className="crm-info-row">
          <span className="crm-info-row-label">ROAS</span>
          <span className="crm-info-row-value">
            {snapshot.roas !== null ? `${snapshot.roas.toFixed(2)}x` : "—"}
          </span>
        </div>
        <div className="crm-info-row">
          <span className="crm-info-row-label">CAC</span>
          <span className="crm-info-row-value">
            {snapshot.cac !== null ? brl(snapshot.cac) : "—"}
          </span>
        </div>
      </div>
    </div>
  );
}
