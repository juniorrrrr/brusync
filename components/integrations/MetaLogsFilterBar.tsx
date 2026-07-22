"use client";

import { useEffect, useState } from "react";
import { CONVERSION_TYPE_LABEL } from "@/domain/conversions/types";
import { useUpdateSearchParams } from "@/hooks/crm/useUpdateSearchParams";

const TYPE_OPTIONS = Object.entries(CONVERSION_TYPE_LABEL);

export function MetaLogsFilterBar() {
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
        placeholder="Buscar por lead..."
        style={{ width: 200 }}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        aria-label="Buscar por lead"
      />

      <select
        className="crm-select"
        value={searchParams.get("type") ?? ""}
        onChange={(e) => update({ type: e.target.value || null })}
        aria-label="Evento"
      >
        <option value="">Todos os eventos</option>
        {TYPE_OPTIONS.map(([value, label]) => (
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
        <option value="sucesso">Sucesso</option>
        <option value="erro">Erro</option>
      </select>

      <input
        type="date"
        className="crm-select"
        value={searchParams.get("from") ?? ""}
        onChange={(e) => update({ from: e.target.value || null })}
        aria-label="De"
      />
      <input
        type="date"
        className="crm-select"
        value={searchParams.get("to") ?? ""}
        onChange={(e) => update({ to: e.target.value || null })}
        aria-label="Até"
      />
    </div>
  );
}
