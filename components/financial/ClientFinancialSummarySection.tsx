"use client";

import { useEffect, useRef } from "react";
import { useFinancialEditor } from "@/contexts/financial/FinancialEditorContext";
import { formatDateTime } from "@/domain/crm/format";
import { useClientFinancialSummary } from "@/hooks/financial/useClientFinancialSummary";

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** Additive section appended to ClientDrawer.tsx (mirrors
 * ClientProjectsSection, Fase 12) — "Receita total, Receita recebida,
 * Projetos faturados, Valor médio, Último pagamento". */
export function ClientFinancialSummarySection({
  clientId,
  clientCompany,
}: {
  clientId: string;
  clientCompany: string;
}) {
  const { summary, loading, reload } = useClientFinancialSummary(clientId);
  const { mode, openCreate } = useFinancialEditor();
  const wasOpenRef = useRef(false);

  useEffect(() => {
    const isOpen = mode !== "closed";
    if (wasOpenRef.current && !isOpen) reload();
    wasOpenRef.current = isOpen;
  }, [mode, reload]);

  return (
    <div className="crm-drawer-section">
      <div className="crm-card-head">
        <div className="crm-drawer-section-title" style={{ marginBottom: 0 }}>
          Financeiro
        </div>
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => openCreate("receita", clientId, clientCompany)}
        >
          Nova receita
        </button>
      </div>

      {loading && <p className="crm-card-sub">Carregando…</p>}
      {!loading && summary && (
        <div className="crm-info-list">
          <div className="crm-info-row">
            <span className="crm-info-row-label">Receita total</span>
            <span className="crm-info-row-value">{formatCurrency(summary.totalRevenue)}</span>
          </div>
          <div className="crm-info-row">
            <span className="crm-info-row-label">Receita recebida</span>
            <span className="crm-info-row-value">{formatCurrency(summary.receivedRevenue)}</span>
          </div>
          <div className="crm-info-row">
            <span className="crm-info-row-label">Projetos faturados</span>
            <span className="crm-info-row-value">{summary.invoicedProjectsCount}</span>
          </div>
          <div className="crm-info-row">
            <span className="crm-info-row-label">Valor médio</span>
            <span className="crm-info-row-value">{formatCurrency(summary.averageTicket)}</span>
          </div>
          <div className="crm-info-row">
            <span className="crm-info-row-label">Último pagamento</span>
            <span className="crm-info-row-value">
              {summary.lastPaymentAt ? formatDateTime(summary.lastPaymentAt) : "—"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
