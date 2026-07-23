"use client";

import { useRouter } from "next/navigation";
import { FinancialTransactionRow } from "@/components/financial/FinancialTransactionRow";
import { useFinancialEditor } from "@/contexts/financial/FinancialEditorContext";
import type { FinancialTransaction } from "@/types/financial";

export function FinancialBoard({ transactions }: { transactions: FinancialTransaction[] }) {
  const router = useRouter();
  const { openCreate } = useFinancialEditor();

  function handleChanged() {
    router.refresh();
  }

  return (
    <div className="crm-ws-card">
      <div className="crm-card-head">
        <div className="crm-drawer-section-title" style={{ marginBottom: 0 }}>
          Lançamentos
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" className="btn btn-outline" onClick={() => openCreate("despesa")}>
            Nova despesa
          </button>
          <button type="button" className="btn btn-accent" onClick={() => openCreate("receita")}>
            Nova receita
          </button>
        </div>
      </div>

      {transactions.length === 0 ? (
        <p className="crm-card-sub">Nenhum lançamento encontrado para os filtros selecionados.</p>
      ) : (
        transactions.map((transaction) => (
          <FinancialTransactionRow
            key={transaction.id}
            transaction={transaction}
            onChanged={handleChanged}
          />
        ))
      )}
    </div>
  );
}
