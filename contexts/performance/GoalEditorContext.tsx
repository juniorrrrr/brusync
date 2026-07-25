"use client";

import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from "react";
import type { GoalWithProgress } from "@/types/performance";

type EditorMode = "closed" | "create" | "edit";

interface GoalEditorContextValue {
  mode: EditorMode;
  editingGoal: GoalWithProgress | null;
  openCreate: () => void;
  openEdit: (goal: GoalWithProgress) => void;
  close: () => void;
}

const GoalEditorContext = createContext<GoalEditorContextValue | null>(null);

/** Mesmo padrão de contexts/financial/FinancialEditorContext.tsx — aqui não
 * precisa buscar o detalhe da meta ao abrir para editar porque a listagem
 * (GoalWithProgress) já carrega tudo que o formulário precisa. */
export function GoalEditorProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<EditorMode>("closed");
  const [editingGoal, setEditingGoal] = useState<GoalWithProgress | null>(null);

  const openCreate = useCallback(() => {
    setEditingGoal(null);
    setMode("create");
  }, []);

  const openEdit = useCallback((goal: GoalWithProgress) => {
    setEditingGoal(goal);
    setMode("edit");
  }, []);

  const close = useCallback(() => {
    setMode("closed");
    setEditingGoal(null);
  }, []);

  const value = useMemo(
    () => ({ mode, editingGoal, openCreate, openEdit, close }),
    [mode, editingGoal, openCreate, openEdit, close],
  );

  return <GoalEditorContext.Provider value={value}>{children}</GoalEditorContext.Provider>;
}

export function useGoalEditor() {
  const ctx = useContext(GoalEditorContext);
  if (!ctx) throw new Error("useGoalEditor deve ser usado dentro de GoalEditorProvider");
  return ctx;
}
