"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { fetchAgendaEventById } from "@/application/agenda/agendaActions";
import type { AgendaEvent } from "@/types/agenda";

interface AgendaEventDialogState {
  mode: "closed" | "create" | "edit";
  event: AgendaEvent | null;
  fixedLeadId: string | null;
  loading: boolean;
  error: string | null;
}

interface AgendaEventDialogContextValue extends AgendaEventDialogState {
  openCreate: (fixedLeadId?: string) => void;
  openEdit: (eventId: string) => void;
  close: () => void;
}

const AgendaEventDialogContext = createContext<AgendaEventDialogContextValue | null>(null);

/** Shared create/edit dialog state for both the main Agenda screen (no
 * fixed lead — the form's own lead picker chooses one) and the Lead
 * Workspace's Agenda tab (fixedLeadId set, picker hidden) — same context +
 * dialog component reused in both places instead of two near-duplicates. */
export function AgendaEventDialogProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AgendaEventDialogState>({
    mode: "closed",
    event: null,
    fixedLeadId: null,
    loading: false,
    error: null,
  });

  const openCreate = useCallback((fixedLeadId?: string) => {
    setState({
      mode: "create",
      event: null,
      fixedLeadId: fixedLeadId ?? null,
      loading: false,
      error: null,
    });
  }, []);

  const openEdit = useCallback((eventId: string) => {
    setState((current) => ({
      mode: "edit",
      event: null,
      fixedLeadId: current.fixedLeadId,
      loading: true,
      error: null,
    }));
    fetchAgendaEventById(eventId)
      .then((event) => {
        setState((current) => ({
          mode: "edit",
          event,
          fixedLeadId: current.fixedLeadId,
          loading: false,
          error: event ? null : "Evento não encontrado.",
        }));
      })
      .catch((err) => {
        setState((current) => ({
          mode: "edit",
          event: null,
          fixedLeadId: current.fixedLeadId,
          loading: false,
          error: err instanceof Error ? err.message : "Falha ao carregar evento.",
        }));
      });
  }, []);

  const close = useCallback(() => {
    setState({ mode: "closed", event: null, fixedLeadId: null, loading: false, error: null });
  }, []);

  const value = useMemo(
    () => ({ ...state, openCreate, openEdit, close }),
    [state, openCreate, openEdit, close],
  );

  return (
    <AgendaEventDialogContext.Provider value={value}>{children}</AgendaEventDialogContext.Provider>
  );
}

export function useAgendaEventDialog() {
  const ctx = useContext(AgendaEventDialogContext);
  if (!ctx)
    throw new Error("useAgendaEventDialog deve ser usado dentro de AgendaEventDialogProvider");
  return ctx;
}
