"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { fetchLeadDetail } from "@/application/crm/leadsActions";
import type { LeadDetailData } from "@/application/crm/leadsQueries";

interface LeadDrawerState {
  leadId: string | null;
  data: LeadDetailData | null;
  loading: boolean;
  error: string | null;
}

interface LeadDrawerContextValue extends LeadDrawerState {
  openLead: (leadId: string) => void;
  close: () => void;
  refresh: () => void;
}

const LeadDrawerContext = createContext<LeadDrawerContextValue | null>(null);

export function LeadDrawerProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<LeadDrawerState>({
    leadId: null,
    data: null,
    loading: false,
    error: null,
  });

  const load = useCallback(async (leadId: string) => {
    setState({ leadId, data: null, loading: true, error: null });
    try {
      const data = await fetchLeadDetail(leadId);
      setState({ leadId, data, loading: false, error: data ? null : "Lead não encontrado." });
    } catch (err) {
      setState({
        leadId,
        data: null,
        loading: false,
        error: err instanceof Error ? err.message : "Falha ao carregar lead.",
      });
    }
  }, []);

  const openLead = useCallback(
    (leadId: string) => {
      void load(leadId);
    },
    [load],
  );

  const close = useCallback(() => {
    setState({ leadId: null, data: null, loading: false, error: null });
  }, []);

  const refresh = useCallback(() => {
    setState((current) => {
      if (current.leadId) void load(current.leadId);
      return current;
    });
  }, [load]);

  const value = useMemo(
    () => ({ ...state, openLead, close, refresh }),
    [state, openLead, close, refresh],
  );

  return <LeadDrawerContext.Provider value={value}>{children}</LeadDrawerContext.Provider>;
}

export function useLeadDrawer() {
  const ctx = useContext(LeadDrawerContext);
  if (!ctx) throw new Error("useLeadDrawer deve ser usado dentro de LeadDrawerProvider");
  return ctx;
}
