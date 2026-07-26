"use client";

import { useEffect, useState, useTransition } from "react";
import { searchAnalyticsAction } from "@/application/analytics/analyticsSearchQueries";
import type { AnalyticsSearchResult } from "@/types/analytics";

/** Mesmo padrão de hooks/operations/useOperationsSearch.ts — debounce de
 * 200ms, uma Server Action por busca. */
export function useAnalyticsSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AnalyticsSearchResult[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timeout = setTimeout(() => {
      startTransition(async () => {
        const found = await searchAnalyticsAction(query);
        setResults(found);
      });
    }, 200);
    return () => clearTimeout(timeout);
  }, [query]);

  return { query, setQuery, results, isPending };
}
