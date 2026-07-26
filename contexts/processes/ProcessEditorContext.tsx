"use client";

import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from "react";
import type { ProcessSummary } from "@/types/processes";

type EditorMode = "closed" | "create" | "edit";

interface ProcessEditorContextValue {
  mode: EditorMode;
  editingProcess: ProcessSummary | null;
  openCreate: () => void;
  openEdit: (process: ProcessSummary) => void;
  close: () => void;
}

const ProcessEditorContext = createContext<ProcessEditorContextValue | null>(null);

/** Mesmo padrão de contexts/performance/GoalEditorContext.tsx — a listagem
 * (ProcessSummary) já carrega tudo que o formulário de edição básica precisa,
 * sem buscar o detalhe completo (etapas/checklist/histórico) só para abrir o
 * modal. */
export function ProcessEditorProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<EditorMode>("closed");
  const [editingProcess, setEditingProcess] = useState<ProcessSummary | null>(null);

  const openCreate = useCallback(() => {
    setEditingProcess(null);
    setMode("create");
  }, []);

  const openEdit = useCallback((process: ProcessSummary) => {
    setEditingProcess(process);
    setMode("edit");
  }, []);

  const close = useCallback(() => {
    setMode("closed");
    setEditingProcess(null);
  }, []);

  const value = useMemo(
    () => ({ mode, editingProcess, openCreate, openEdit, close }),
    [mode, editingProcess, openCreate, openEdit, close],
  );

  return <ProcessEditorContext.Provider value={value}>{children}</ProcessEditorContext.Provider>;
}

export function useProcessEditor() {
  const ctx = useContext(ProcessEditorContext);
  if (!ctx) throw new Error("useProcessEditor deve ser usado dentro de ProcessEditorProvider");
  return ctx;
}
