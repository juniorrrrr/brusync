"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchClientFinancialSummary } from "@/application/financial/financialClientQueries";
import type { ClientFinancialSummary } from "@/types/financial";

/** Mirrors useClientProjects (Fase 12) — client-side fetch + reload, used
 * by the Cliente drawer's additive "Financeiro" section. */
export function useClientFinancialSummary(clientId: string) {
  const [summary, setSummary] = useState<ClientFinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    setSummary(await fetchClientFinancialSummary(clientId));
    setLoading(false);
  }, [clientId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { summary, loading, reload };
}
