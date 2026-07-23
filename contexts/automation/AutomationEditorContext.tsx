"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { fetchWorkflowById } from "@/application/automation/workflowsActions";
import type { AutomationWorkflow } from "@/types/automation";

interface AutomationEditorState {
  mode: "closed" | "create" | "edit";
  workflow: AutomationWorkflow | null;
  loading: boolean;
  error: string | null;
}

interface AutomationEditorContextValue extends AutomationEditorState {
  openCreate: () => void;
  openEdit: (workflowId: string) => void;
  close: () => void;
}

const AutomationEditorContext = createContext<AutomationEditorContextValue | null>(null);

export function AutomationEditorProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AutomationEditorState>({
    mode: "closed",
    workflow: null,
    loading: false,
    error: null,
  });

  const openCreate = useCallback(() => {
    setState({ mode: "create", workflow: null, loading: false, error: null });
  }, []);

  const openEdit = useCallback((workflowId: string) => {
    setState({ mode: "edit", workflow: null, loading: true, error: null });
    fetchWorkflowById(workflowId)
      .then((workflow) => {
        setState({
          mode: "edit",
          workflow,
          loading: false,
          error: workflow ? null : "Automação não encontrada.",
        });
      })
      .catch((err) => {
        setState({
          mode: "edit",
          workflow: null,
          loading: false,
          error: err instanceof Error ? err.message : "Falha ao carregar automação.",
        });
      });
  }, []);

  const close = useCallback(() => {
    setState({ mode: "closed", workflow: null, loading: false, error: null });
  }, []);

  const value = useMemo(
    () => ({ ...state, openCreate, openEdit, close }),
    [state, openCreate, openEdit, close],
  );

  return (
    <AutomationEditorContext.Provider value={value}>{children}</AutomationEditorContext.Provider>
  );
}

export function useAutomationEditor() {
  const ctx = useContext(AutomationEditorContext);
  if (!ctx)
    throw new Error("useAutomationEditor deve ser usado dentro de AutomationEditorProvider");
  return ctx;
}
