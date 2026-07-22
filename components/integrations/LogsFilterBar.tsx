"use client";

import { useEffect, useState } from "react";
import { useUpdateSearchParams } from "@/hooks/crm/useUpdateSearchParams";

const LOG_STATUS_OPTIONS: [string, string][] = [
  ["success", "Sucesso"],
  ["error", "Erro"],
  ["pending", "Pendente"],
];

export function LogsFilterBar({
  providerOptions,
}: {
  providerOptions: { value: string; label: string }[];
}) {
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
        placeholder="Buscar por evento ou mensagem..."
        style={{ width: 220 }}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        aria-label="Buscar log"
      />

      <select
        className="crm-select"
        value={searchParams.get("provider") ?? ""}
        onChange={(e) => update({ provider: e.target.value || null })}
        aria-label="Integração"
      >
        <option value="">Todas as integrações</option>
        {providerOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
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
        {LOG_STATUS_OPTIONS.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}
