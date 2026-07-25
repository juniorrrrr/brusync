"use client";

import { useEffect, useState, useTransition } from "react";
import { searchOperationsAction } from "@/application/operations/operationsSearchQueries";
import type { OperationsSearchResult } from "@/types/operations";

/** Debounced global search across every module — same 200ms debounce used
 * by every other search box in the app (components/crm/GlobalSearch.tsx,
 * components/knowledge/KnowledgeGlobalSearch.tsx). */
export function useOperationsSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<OperationsSearchResult[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timeout = setTimeout(() => {
      startTransition(async () => {
        const found = await searchOperationsAction(query);
        setResults(found);
      });
    }, 200);
    return () => clearTimeout(timeout);
  }, [query]);

  return { query, setQuery, results, isPending };
}
