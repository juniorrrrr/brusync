"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { KnowledgeCategory } from "@/types/knowledge";

interface CategoryDialogState {
  mode: "closed" | "create" | "edit";
  category: KnowledgeCategory | null;
}

interface CategoryDialogContextValue extends CategoryDialogState {
  openCreate: () => void;
  openEdit: (category: KnowledgeCategory) => void;
  close: () => void;
}

const KnowledgeCategoryDialogContext = createContext<CategoryDialogContextValue | null>(null);

/** Global create/edit state for Knowledge categories — mounted once at the
 * CRM shell (KnowledgeCategoryDialog reads it) so "Nova categoria" can be
 * triggered both from the Biblioteca sidebar and from the dashboard. */
export function KnowledgeCategoryDialogProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CategoryDialogState>({ mode: "closed", category: null });

  const openCreate = useCallback(() => setState({ mode: "create", category: null }), []);
  const openEdit = useCallback(
    (category: KnowledgeCategory) => setState({ mode: "edit", category }),
    [],
  );
  const close = useCallback(() => setState({ mode: "closed", category: null }), []);

  const value = useMemo(
    () => ({ ...state, openCreate, openEdit, close }),
    [state, openCreate, openEdit, close],
  );

  return (
    <KnowledgeCategoryDialogContext.Provider value={value}>
      {children}
    </KnowledgeCategoryDialogContext.Provider>
  );
}

export function useKnowledgeCategoryDialog() {
  const ctx = useContext(KnowledgeCategoryDialogContext);
  if (!ctx) {
    throw new Error(
      "useKnowledgeCategoryDialog deve ser usado dentro de KnowledgeCategoryDialogProvider",
    );
  }
  return ctx;
}
