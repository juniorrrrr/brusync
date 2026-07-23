import type { ProjectFinancialSummary } from "@/types/financial";

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** Read-only financial summary shown on the client's own project page —
 * only ever "Valor contratado/recebido/Saldo/Percentual" (RLS on
 * crm_financial_transactions already restricts the query behind this to
 * kind="receita" and the portal user's own client_id — never despesas,
 * never another client's figures). */
export function PortalProjectFinancialCard({ summary }: { summary: ProjectFinancialSummary }) {
  if (summary.contractedValue === 0) return null;

  return (
    <div className="crm-ws-card" style={{ marginTop: 16 }}>
      <div className="crm-ws-card-title">Financeiro</div>
      <div className="crm-info-list">
        <div className="crm-info-row">
          <span className="crm-info-row-label">Valor contratado</span>
          <span className="crm-info-row-value">{formatCurrency(summary.contractedValue)}</span>
        </div>
        <div className="crm-info-row">
          <span className="crm-info-row-label">Valor recebido</span>
          <span className="crm-info-row-value">{formatCurrency(summary.receivedValue)}</span>
        </div>
        <div className="crm-info-row">
          <span className="crm-info-row-label">Saldo restante</span>
          <span className="crm-info-row-value">{formatCurrency(summary.balance)}</span>
        </div>
      </div>
      <div className="crm-pj-progress-track" style={{ marginTop: 12 }}>
        <div className="crm-pj-progress-fill" style={{ width: `${summary.percentReceived}%` }} />
      </div>
    </div>
  );
}
