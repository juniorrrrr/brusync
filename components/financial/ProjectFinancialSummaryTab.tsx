"use client";

import { useEffect, useRef } from "react";
import { useFinancialEditor } from "@/contexts/financial/FinancialEditorContext";
import { useProjectFinancialSummary } from "@/hooks/financial/useProjectFinancialSummary";

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** Additive tab in ProjectDrawer.tsx (mirrors the Fase 13 "Mensagens" tab
 * addition) — "Valor contratado, Valor recebido, Saldo restante,
 * Percentual financeiro", all computed from crm_financial_transactions
 * linked to this project, never a new column on crm_projects. */
export function ProjectFinancialSummaryTab({
  projectId,
  clientId,
  clientCompany,
}: {
  projectId: string;
  clientId: string | null;
  clientCompany: string | null;
}) {
  const { summary, loading, reload } = useProjectFinancialSummary(projectId);
  const { mode, openCreate } = useFinancialEditor();
  const wasOpenRef = useRef(false);

  useEffect(() => {
    const isOpen = mode !== "closed";
    if (wasOpenRef.current && !isOpen) reload();
    wasOpenRef.current = isOpen;
  }, [mode, reload]);

  if (loading) return <p className="crm-card-sub">Carregando…</p>;
  if (!summary) return null;

  return (
    <div>
      <div className="crm-card-head">
        <div />
        <button
          type="button"
          className="crm-pj-action-btn"
          onClick={() =>
            openCreate("receita", clientId ?? undefined, clientCompany ?? undefined, projectId)
          }
        >
          Nova receita
        </button>
      </div>

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
        <div className="crm-info-row">
          <span className="crm-info-row-label">Percentual financeiro</span>
          <span className="crm-info-row-value">{summary.percentReceived}%</span>
        </div>
      </div>

      <div className="crm-pj-progress-track" style={{ marginTop: 12 }}>
        <div className="crm-pj-progress-fill" style={{ width: `${summary.percentReceived}%` }} />
      </div>
    </div>
  );
}
