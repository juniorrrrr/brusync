import Link from "next/link";
import type { OperationsFinancialSnapshot } from "@/types/operations";

function brl(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function OperationsFinancialWidget({ snapshot }: { snapshot: OperationsFinancialSnapshot }) {
  return (
    <div className="crm-card crm-card-pad reveal in">
      <div className="crm-card-head">
        <div>
          <div className="crm-card-title">Saúde financeira</div>
        </div>
        <Link href="/financeiro" className="btn btn-outline">
          Ver financeiro
        </Link>
      </div>
      <div className="crm-info-list" style={{ marginTop: 8 }}>
        <div className="crm-info-row">
          <span className="crm-info-row-label">Receita prevista</span>
          <span className="crm-info-row-value">{brl(snapshot.expectedRevenue)}</span>
        </div>
        <div className="crm-info-row">
          <span className="crm-info-row-label">Receita recebida</span>
          <span className="crm-info-row-value">{brl(snapshot.receivedRevenue)}</span>
        </div>
        <div className="crm-info-row">
          <span className="crm-info-row-label">Receita do mês</span>
          <span className="crm-info-row-value">{brl(snapshot.monthRevenue)}</span>
        </div>
        <div className="crm-info-row">
          <span className="crm-info-row-label">Vencido em aberto</span>
          <span className="crm-info-row-value">{brl(snapshot.overdueAmount)}</span>
        </div>
      </div>
    </div>
  );
}
