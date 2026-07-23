"use client";

import { createContext, type ReactNode, useCallback, useContext, useState } from "react";
import { fetchFinancialTransactionDetail } from "@/application/financial/financialTransactionsActions";
import type { FinancialTransactionDetail, FinancialTransactionKind } from "@/types/financial";

type EditorMode = "closed" | "create" | "edit";

interface FinancialEditorContextValue {
  mode: EditorMode;
  kind: FinancialTransactionKind;
  transaction: FinancialTransactionDetail | null;
  fixedClientId: string | null;
  fixedClientCompany: string | null;
  fixedProjectId: string | null;
  loading: boolean;
  error: string | null;
  openCreate: (
    kind: FinancialTransactionKind,
    fixedClientId?: string,
    fixedClientCompany?: string,
    fixedProjectId?: string,
  ) => void;
  openEdit: (transactionId: string) => Promise<void>;
  refresh: () => Promise<void>;
  close: () => void;
}

const FinancialEditorContext = createContext<FinancialEditorContextValue | null>(null);

/** Mirrors ProjectEditorContext (Fase 12) exactly — the same "Novo
 * lançamento" dialog is reachable from the main /financeiro list (no fixed
 * client/project) and from the Cliente/Projeto drawers' quick-create
 * buttons (fixedClientId/fixedProjectId pre-set, pickers hidden). */
export function FinancialEditorProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<EditorMode>("closed");
  const [kind, setKind] = useState<FinancialTransactionKind>("receita");
  const [transaction, setTransaction] = useState<FinancialTransactionDetail | null>(null);
  const [fixedClientId, setFixedClientId] = useState<string | null>(null);
  const [fixedClientCompany, setFixedClientCompany] = useState<string | null>(null);
  const [fixedProjectId, setFixedProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openCreate = useCallback(
    (
      nextKind: FinancialTransactionKind,
      clientId?: string,
      clientCompany?: string,
      projectId?: string,
    ) => {
      setKind(nextKind);
      setTransaction(null);
      setFixedClientId(clientId ?? null);
      setFixedClientCompany(clientCompany ?? null);
      setFixedProjectId(projectId ?? null);
      setError(null);
      setMode("create");
    },
    [],
  );

  const openEdit = useCallback(async (transactionId: string) => {
    setMode("edit");
    setLoading(true);
    setError(null);
    try {
      const detail = await fetchFinancialTransactionDetail(transactionId);
      if (!detail) {
        setError("Lançamento não encontrado.");
      } else {
        setTransaction(detail);
        setKind(detail.kind);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  /** Re-fetches the currently-open transaction in place — needed because
   * marking an installment paid/reopening it or uploading a document
   * changes server data that this modal's own `transaction` state (fetched
   * once in openEdit) doesn't otherwise learn about; a page-level
   * router.refresh() alone updates the list behind the modal, never the
   * modal's own already-fetched copy. */
  const refresh = useCallback(async () => {
    if (mode !== "edit" || !transaction) return;
    const detail = await fetchFinancialTransactionDetail(transaction.id);
    if (detail) setTransaction(detail);
  }, [mode, transaction]);

  const close = useCallback(() => {
    setMode("closed");
    setTransaction(null);
    setFixedClientId(null);
    setFixedClientCompany(null);
    setFixedProjectId(null);
    setError(null);
  }, []);

  return (
    <FinancialEditorContext.Provider
      value={{
        mode,
        kind,
        transaction,
        fixedClientId,
        fixedClientCompany,
        fixedProjectId,
        loading,
        error,
        openCreate,
        openEdit,
        refresh,
        close,
      }}
    >
      {children}
    </FinancialEditorContext.Provider>
  );
}

export function useFinancialEditor() {
  const ctx = useContext(FinancialEditorContext);
  if (!ctx) throw new Error("useFinancialEditor must be used within FinancialEditorProvider");
  return ctx;
}
