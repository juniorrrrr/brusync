"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

interface ConversationDialogState {
  open: boolean;
  fixedCrmLeadId: string | null;
  fixedCrmLeadName: string | null;
  fixedClientId: string | null;
  fixedClientCompany: string | null;
}

interface ConversationDialogContextValue extends ConversationDialogState {
  openCreate: (fixed?: {
    crmLeadId?: string;
    crmLeadName?: string;
    clientId?: string;
    clientCompany?: string;
  }) => void;
  close: () => void;
}

const INITIAL_STATE: ConversationDialogState = {
  open: false,
  fixedCrmLeadId: null,
  fixedCrmLeadName: null,
  fixedClientId: null,
  fixedClientCompany: null,
};

const ConversationDialogContext = createContext<ConversationDialogContextValue | null>(null);

export function ConversationDialogProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ConversationDialogState>(INITIAL_STATE);

  const openCreate = useCallback<ConversationDialogContextValue["openCreate"]>((fixed) => {
    setState({
      open: true,
      fixedCrmLeadId: fixed?.crmLeadId ?? null,
      fixedCrmLeadName: fixed?.crmLeadName ?? null,
      fixedClientId: fixed?.clientId ?? null,
      fixedClientCompany: fixed?.clientCompany ?? null,
    });
  }, []);

  const close = useCallback(() => setState(INITIAL_STATE), []);

  const value = useMemo(() => ({ ...state, openCreate, close }), [state, openCreate, close]);

  return (
    <ConversationDialogContext.Provider value={value}>
      {children}
    </ConversationDialogContext.Provider>
  );
}

export function useConversationDialog() {
  const ctx = useContext(ConversationDialogContext);
  if (!ctx) throw new Error("useConversationDialog must be used within ConversationDialogProvider");
  return ctx;
}
