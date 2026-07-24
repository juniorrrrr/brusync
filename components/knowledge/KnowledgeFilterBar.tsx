"use client";

import { useEffect, useState } from "react";
import {
  KNOWLEDGE_CONTENT_TYPE_LABEL,
  KNOWLEDGE_CONTENT_TYPES,
  KNOWLEDGE_STATUS_LABEL,
  KNOWLEDGE_STATUSES,
} from "@/domain/knowledge/types";
import { useUpdateSearchParams } from "@/hooks/crm/useUpdateSearchParams";

export function KnowledgeFilterBar() {
  const { update, searchParams } = useUpdateSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") ?? "");

  // biome-ignore lint/correctness/useExhaustiveDependencies: update is stable (see useUpdateSearchParams); only search should re-trigger the debounce.
  useEffect(() => {
    const timeout = setTimeout(() => update({ q: search || null }, { resetPage: true }), 300);
    return () => clearTimeout(timeout);
  }, [search]);

  return (
    <div className="crm-toolbar" style={{ flexWrap: "wrap" }}>
      <input
        type="text"
        className="crm-select"
        placeholder="Buscar por título…"
        style={{ width: 240 }}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        aria-label="Buscar"
      />

      <select
        className="crm-select"
        value={searchParams.get("status") ?? ""}
        onChange={(e) => update({ status: e.target.value || null }, { resetPage: true })}
        aria-label="Status"
      >
        <option value="">Todos os status</option>
        {KNOWLEDGE_STATUSES.map((status) => (
          <option key={status} value={status}>
            {KNOWLEDGE_STATUS_LABEL[status]}
          </option>
        ))}
      </select>

      <select
        className="crm-select"
        value={searchParams.get("contentType") ?? ""}
        onChange={(e) => update({ contentType: e.target.value || null }, { resetPage: true })}
        aria-label="Tipo de conteúdo"
      >
        <option value="">Todos os tipos</option>
        {KNOWLEDGE_CONTENT_TYPES.map((type) => (
          <option key={type} value={type}>
            {KNOWLEDGE_CONTENT_TYPE_LABEL[type]}
          </option>
        ))}
      </select>
    </div>
  );
}
