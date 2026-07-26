"use client";

import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from "react";

interface TeamCheckinSchedulerContextValue {
  open: boolean;
  memberId: string | null;
  openFor: (memberId?: string) => void;
  close: () => void;
}

const TeamCheckinSchedulerContext = createContext<TeamCheckinSchedulerContextValue | null>(null);

export function TeamCheckinSchedulerProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [memberId, setMemberId] = useState<string | null>(null);

  const openFor = useCallback((id?: string) => {
    setMemberId(id ?? null);
    setOpen(true);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setMemberId(null);
  }, []);

  const value = useMemo(
    () => ({ open, memberId, openFor, close }),
    [open, memberId, openFor, close],
  );

  return (
    <TeamCheckinSchedulerContext.Provider value={value}>
      {children}
    </TeamCheckinSchedulerContext.Provider>
  );
}

export function useTeamCheckinScheduler() {
  const ctx = useContext(TeamCheckinSchedulerContext);
  if (!ctx) {
    throw new Error(
      "useTeamCheckinScheduler deve ser usado dentro de TeamCheckinSchedulerProvider",
    );
  }
  return ctx;
}
