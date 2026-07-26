"use client";

import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from "react";
import type { AnalyticsWidget } from "@/types/analytics";

type EditorMode = "closed" | "create" | "edit";

interface AnalyticsWidgetEditorContextValue {
  mode: EditorMode;
  editingWidget: AnalyticsWidget | null;
  openCreate: () => void;
  openEdit: (widget: AnalyticsWidget) => void;
  close: () => void;
}

const AnalyticsWidgetEditorContext = createContext<AnalyticsWidgetEditorContextValue | null>(null);

/** Mesmo padrão de contexts/team/TeamGoalEditorContext.tsx. */
export function AnalyticsWidgetEditorProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<EditorMode>("closed");
  const [editingWidget, setEditingWidget] = useState<AnalyticsWidget | null>(null);

  const openCreate = useCallback(() => {
    setEditingWidget(null);
    setMode("create");
  }, []);

  const openEdit = useCallback((widget: AnalyticsWidget) => {
    setEditingWidget(widget);
    setMode("edit");
  }, []);

  const close = useCallback(() => {
    setMode("closed");
    setEditingWidget(null);
  }, []);

  const value = useMemo(
    () => ({ mode, editingWidget, openCreate, openEdit, close }),
    [mode, editingWidget, openCreate, openEdit, close],
  );

  return (
    <AnalyticsWidgetEditorContext.Provider value={value}>
      {children}
    </AnalyticsWidgetEditorContext.Provider>
  );
}

export function useAnalyticsWidgetEditor() {
  const ctx = useContext(AnalyticsWidgetEditorContext);
  if (!ctx) {
    throw new Error(
      "useAnalyticsWidgetEditor deve ser usado dentro de AnalyticsWidgetEditorProvider",
    );
  }
  return ctx;
}
