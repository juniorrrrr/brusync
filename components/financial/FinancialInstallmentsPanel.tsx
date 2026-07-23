"use client";

import {
  markInstallmentPaidAction,
  reopenInstallmentAction,
} from "@/application/financial/financialInstallmentsActions";
import { formatDateTime } from "@/domain/crm/format";
import type { FinancialInstallment } from "@/types/financial";

const INSTALLMENT_STATUS_LABEL: Record<FinancialInstallment["status"], string> = {
  pendente: "Pendente",
  pago: "Pago",
  parcial: "Parcial",
  vencido: "Vencido",
  cancelado: "Cancelado",
};

const INSTALLMENT_STATUS_BADGE: Record<FinancialInstallment["status"], string> = {
  pendente: "info",
  pago: "ok",
  parcial: "warn",
  vencido: "danger",
  cancelado: "neutral",
};

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** "Situação individual" + "Pagamento parcial" + "Reabertura" — every
 * transaction has at least one installment (see
 * domain/financial/calculations.ts), so this list is always populated,
 * even for a non-parcelado lançamento. */
export function FinancialInstallmentsPanel({
  transactionId,
  installments,
  onChanged,
}: {
  transactionId: string;
  installments: FinancialInstallment[];
  onChanged: () => void;
}) {
  async function handleMarkPaid(installmentId: string) {
    const result = await markInstallmentPaidAction(installmentId, transactionId);
    if (result.error) window.alert(result.error);
    onChanged();
  }

  async function handleReopen(installmentId: string) {
    const result = await reopenInstallmentAction(installmentId, transactionId);
    if (result.error) window.alert(result.error);
    onChanged();
  }

  if (installments.length === 0) {
    return <p className="crm-card-sub">Nenhuma parcela registrada.</p>;
  }

  return (
    <div>
      {installments.map((installment) => (
        <div key={installment.id} className="crm-pj-task-row">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <strong>
                Parcela {installment.installmentNumber}/{installments.length}
              </strong>
              <span className={`crm-badge ${INSTALLMENT_STATUS_BADGE[installment.status]}`}>
                {INSTALLMENT_STATUS_LABEL[installment.status]}
              </span>
              <span className="crm-card-sub" style={{ margin: 0 }}>
                {formatCurrency(installment.amount)}
              </span>
            </div>
            <div className="crm-pj-desc">
              Vencimento: {formatDateTime(installment.dueDate)}
              {installment.paidAt ? ` · Pago em ${formatDateTime(installment.paidAt)}` : ""}
            </div>
          </div>
          {installment.status === "pago" ? (
            <button
              type="button"
              className="crm-pj-action-btn"
              onClick={() => handleReopen(installment.id)}
            >
              Reabrir
            </button>
          ) : (
            <button
              type="button"
              className="crm-pj-action-btn"
              onClick={() => handleMarkPaid(installment.id)}
            >
              Marcar como pago
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
