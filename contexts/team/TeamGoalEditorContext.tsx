"use client";

import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from "react";
import type { TeamGoalWithProgress } from "@/types/team";

type EditorMode = "closed" | "create" | "edit";

interface TeamGoalEditorContextValue {
  mode: EditorMode;
  editingGoal: TeamGoalWithProgress | null;
  openCreate: () => void;
  openEdit: (goal: TeamGoalWithProgress) => void;
  close: () => void;
}

const TeamGoalEditorContext = createContext<TeamGoalEditorContextValue | null>(null);

/** Mesmo padrão de contexts/performance/GoalEditorContext.tsx. */
export function TeamGoalEditorProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<EditorMode>("closed");
  const [editingGoal, setEditingGoal] = useState<TeamGoalWithProgress | null>(null);

  const openCreate = useCallback(() => {
    setEditingGoal(null);
    setMode("create");
  }, []);

  const openEdit = useCallback((goal: TeamGoalWithProgress) => {
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

  return <TeamGoalEditorContext.Provider value={value}>{children}</TeamGoalEditorContext.Provider>;
}

export function useTeamGoalEditor() {
  const ctx = useContext(TeamGoalEditorContext);
  if (!ctx) throw new Error("useTeamGoalEditor deve ser usado dentro de TeamGoalEditorProvider");
  return ctx;
}
