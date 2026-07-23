"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ProjectTask } from "@/types/projects";

interface ProjectTaskDialogState {
  mode: "closed" | "create" | "edit";
  task: ProjectTask | null;
  phaseId: string | null;
}

interface ProjectTaskDialogContextValue extends ProjectTaskDialogState {
  openCreate: (phaseId: string | null) => void;
  openEdit: (task: ProjectTask) => void;
  close: () => void;
}

const ProjectTaskDialogContext = createContext<ProjectTaskDialogContextValue | null>(null);

/** Unlike ProjectEditorContext, this never fetches — the task data already
 * lives in the Project Drawer's already-loaded ProjectDetail, so opening
 * for edit just hands over the object that's already in memory. */
export function ProjectTaskDialogProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ProjectTaskDialogState>({
    mode: "closed",
    task: null,
    phaseId: null,
  });

  const openCreate = useCallback((phaseId: string | null) => {
    setState({ mode: "create", task: null, phaseId });
  }, []);

  const openEdit = useCallback((task: ProjectTask) => {
    setState({ mode: "edit", task, phaseId: task.phaseId });
  }, []);

  const close = useCallback(() => {
    setState({ mode: "closed", task: null, phaseId: null });
  }, []);

  const value = useMemo(
    () => ({ ...state, openCreate, openEdit, close }),
    [state, openCreate, openEdit, close],
  );

  return (
    <ProjectTaskDialogContext.Provider value={value}>{children}</ProjectTaskDialogContext.Provider>
  );
}

export function useProjectTaskDialog() {
  const ctx = useContext(ProjectTaskDialogContext);
  if (!ctx)
    throw new Error("useProjectTaskDialog deve ser usado dentro de ProjectTaskDialogProvider");
  return ctx;
}
