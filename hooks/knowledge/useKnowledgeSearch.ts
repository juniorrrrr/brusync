"use client";

import { useEffect, useState, useTransition } from "react";
import { searchKnowledgeAction } from "@/application/knowledge/knowledgeSearchQueries";
import type { KnowledgeSearchResult } from "@/types/knowledge";

/** Debounced global search over the Knowledge Center — title, content,
 * category, tags, author, client, project, lead and file name (see
 * services/knowledge/knowledgeSearchService.ts). Mirrors the debounce
 * timing used by components/crm/GlobalSearch.tsx. */
export function useKnowledgeSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<KnowledgeSearchResult[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timeout = setTimeout(() => {
      startTransition(async () => {
        const found = await searchKnowledgeAction(query);
        setResults(found);
      });
    }, 200);
    return () => clearTimeout(timeout);
  }, [query]);

  return { query, setQuery, results, isPending };
}
