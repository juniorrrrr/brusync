"use client";

import { useEffect, useState } from "react";
import {
  CONVERSION_DELIVERY_STATUS_LABEL,
  CONVERSION_DESTINATION_LABEL,
  CONVERSION_TYPE_LABEL,
} from "@/domain/conversions/types";
import { useUpdateSearchParams } from "@/hooks/crm/useUpdateSearchParams";

const TYPE_OPTIONS = Object.entries(CONVERSION_TYPE_LABEL);
const DESTINATION_OPTIONS = Object.entries(CONVERSION_DESTINATION_LABEL);
const STATUS_OPTIONS = Object.entries(CONVERSION_DELIVERY_STATUS_LABEL);

export function ConversionsFilterBar() {
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
        aria-label="Tipo de evento"
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
        value={searchParams.get("destination") ?? ""}
        onChange={(e) => update({ destination: e.target.value || null })}
        aria-label="Destino"
      >
        <option value="">Todos os destinos</option>
        {DESTINATION_OPTIONS.map(([value, label]) => (
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
