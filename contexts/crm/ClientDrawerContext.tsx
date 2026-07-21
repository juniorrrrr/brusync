"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { fetchClientDetail } from "@/application/crm/clientsActions";
import type { ClientWithOwner } from "@/types/crm";

interface ClientDrawerData {
  client: ClientWithOwner;
  owners: { id: string; name: string | null; email: string | null }[];
}

interface ClientDrawerState {
  clientId: string | null;
  data: ClientDrawerData | null;
  loading: boolean;
  error: string | null;
}

interface ClientDrawerContextValue extends ClientDrawerState {
  openClient: (clientId: string) => void;
  close: () => void;
  refresh: () => void;
}

const ClientDrawerContext = createContext<ClientDrawerContextValue | null>(null);

export function ClientDrawerProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ClientDrawerState>({
    clientId: null,
    data: null,
    loading: false,
    error: null,
  });

  const load = useCallback(async (clientId: string) => {
    setState({ clientId, data: null, loading: true, error: null });
    try {
      const data = await fetchClientDetail(clientId);
      setState({ clientId, data, loading: false, error: data ? null : "Cliente não encontrado." });
    } catch (err) {
      setState({
        clientId,
        data: null,
        loading: false,
        error: err instanceof Error ? err.message : "Falha ao carregar cliente.",
      });
    }
  }, []);

  const openClient = useCallback((clientId: string) => void load(clientId), [load]);

  const close = useCallback(() => {
    setState({ clientId: null, data: null, loading: false, error: null });
  }, []);

  const refresh = useCallback(() => {
    setState((current) => {
      if (current.clientId) void load(current.clientId);
      return current;
    });
  }, [load]);

  const value = useMemo(
    () => ({ ...state, openClient, close, refresh }),
    [state, openClient, close, refresh],
  );

  return <ClientDrawerContext.Provider value={value}>{children}</ClientDrawerContext.Provider>;
}

export function useClientDrawer() {
  const ctx = useContext(ClientDrawerContext);
  if (!ctx) throw new Error("useClientDrawer deve ser usado dentro de ClientDrawerProvider");
  return ctx;
}
