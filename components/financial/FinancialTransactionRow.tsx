"use client";

import {
  cancelTransactionAction,
  deleteTransactionAction,
} from "@/application/financial/financialTransactionsActions";
import { useFinancialEditor } from "@/contexts/financial/FinancialEditorContext";
import { formatDateTime } from "@/domain/crm/format";
import { financialStatusBadge, financialStatusLabel } from "@/domain/financial/types";
import type { FinancialTransaction } from "@/types/financial";

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function FinancialTransactionRow({
  transaction,
  onChanged,
}: {
  transaction: FinancialTransaction;
  onChanged: () => void;
}) {
  const { openEdit } = useFinancialEditor();

  async function handleCancel() {
    if (!window.confirm(`Cancelar o lançamento "${transaction.description}"?`)) return;
    const result = await cancelTransactionAction(transaction.id);
    if (result.error) window.alert(result.error);
    onChanged();
  }

  async function handleDelete() {
    if (!window.confirm(`Excluir definitivamente "${transaction.description}"?`)) return;
    const result = await deleteTransactionAction(transaction.id);
    if (result.error) window.alert(result.error);
    onChanged();
  }

  const isOverdue =
    transaction.dueDate &&
    new Date(transaction.dueDate).getTime() < Date.now() &&
    transaction.status !== "pago" &&
    transaction.status !== "cancelado";

  return (
    <div className="crm-pj-row">
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            className="crm-back-link"
            style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}
            onClick={() => openEdit(transaction.id)}
          >
            {transaction.description}
          </button>
          <span className={`crm-badge ${transaction.kind === "receita" ? "ok" : "neutral"}`}>
            {transaction.kind === "receita" ? "Receita" : "Despesa"}
          </span>
          <span className={`crm-badge ${financialStatusBadge(transaction.status)}`}>
            {financialStatusLabel(transaction.status, transaction.kind)}
          </span>
          {isOverdue && (
            <span className="crm-badge danger" style={{ fontSize: 10 }}>
              Vencido
            </span>
          )}
        </div>
        <div className="crm-pj-desc">
          {transaction.clientCompany ?? "Sem cliente"}
          {transaction.projectName ? ` · ${transaction.projectName}` : ""}
          {transaction.categoryName ? ` · ${transaction.categoryName}` : ""}
          {transaction.dueDate ? ` · Vencimento: ${formatDateTime(transaction.dueDate)}` : ""}
        </div>
      </div>
      <div className="crm-pj-row-actions">
        <strong style={{ fontSize: 14 }}>{formatCurrency(transaction.amount)}</strong>
        <button
          type="button"
          className="crm-pj-action-btn"
          onClick={() => openEdit(transaction.id)}
        >
          Abrir
        </button>
        {transaction.status !== "cancelado" && (
          <button type="button" className="crm-pj-action-btn" onClick={handleCancel}>
            Cancelar
          </button>
        )}
        <button type="button" className="crm-pj-action-btn danger" onClick={handleDelete}>
          Excluir
        </button>
      </div>
    </div>
  );
}
