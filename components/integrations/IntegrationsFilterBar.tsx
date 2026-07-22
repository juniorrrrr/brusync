"use client";

import { useEffect, useState } from "react";
import { useUpdateSearchParams } from "@/hooks/crm/useUpdateSearchParams";
import { INTEGRATION_CATEGORY_LABEL, INTEGRATION_STATUS_LABEL } from "@/types/integrations";

const CATEGORY_OPTIONS = Object.entries(INTEGRATION_CATEGORY_LABEL);
const STATUS_OPTIONS = Object.entries(INTEGRATION_STATUS_LABEL);

export function IntegrationsFilterBar() {
  const { update, searchParams } = useUpdateSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") ?? "");

  useEffect(() => {
    const timeout = setTimeout(() => update({ q: search || null }), 300);
    return () => clearTimeout(timeout);
  }, [search, update]);

  return (
    <div className="crm-toolbar">
      <input
        type="text"
        className="crm-select"
        placeholder="Buscar integração..."
        style={{ width: 200 }}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        aria-label="Buscar integração"
      />

      <select
        className="crm-select"
        value={searchParams.get("category") ?? ""}
        onChange={(e) => update({ category: e.target.value || null })}
        aria-label="Categoria"
      >
        <option value="">Todas as categorias</option>
        {CATEGORY_OPTIONS.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      <select
        className="crm-select"
        value={searchParams.get("status") ?? ""}
        onChange={(e) => update({ status: e.target.value || null })}
        aria-label="Status"
      >
        <option value="">Todos os status</option>
        {STATUS_OPTIONS.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}
