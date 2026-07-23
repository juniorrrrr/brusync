"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchProjectFinancialSummary } from "@/application/financial/financialProjectQueries";
import type { ProjectFinancialSummary } from "@/types/financial";

/** Mirrors useClientFinancialSummary — used by the Projeto drawer's
 * additive "Financeiro" tab. */
export function useProjectFinancialSummary(projectId: string) {
  const [summary, setSummary] = useState<ProjectFinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    setSummary(await fetchProjectFinancialSummary(projectId));
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { summary, loading, reload };
}
