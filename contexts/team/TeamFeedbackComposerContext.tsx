"use client";

import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from "react";

interface TeamFeedbackComposerContextValue {
  open: boolean;
  recipientId: string | null;
  openFor: (recipientId?: string) => void;
  close: () => void;
}

const TeamFeedbackComposerContext = createContext<TeamFeedbackComposerContextValue | null>(null);

export function TeamFeedbackComposerProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [recipientId, setRecipientId] = useState<string | null>(null);

  const openFor = useCallback((id?: string) => {
    setRecipientId(id ?? null);
    setOpen(true);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setRecipientId(null);
  }, []);

  const value = useMemo(
    () => ({ open, recipientId, openFor, close }),
    [open, recipientId, openFor, close],
  );

  return (
    <TeamFeedbackComposerContext.Provider value={value}>
      {children}
    </TeamFeedbackComposerContext.Provider>
  );
}

export function useTeamFeedbackComposer() {
  const ctx = useContext(TeamFeedbackComposerContext);
  if (!ctx) {
    throw new Error(
      "useTeamFeedbackComposer deve ser usado dentro de TeamFeedbackComposerProvider",
    );
  }
  return ctx;
}
