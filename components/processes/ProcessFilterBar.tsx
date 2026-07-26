"use client";

import { useEffect, useState } from "react";
import { PROCESS_STATUS_LABEL, PROCESS_STATUSES } from "@/domain/processes/statusMeta";
import { useUpdateSearchParams } from "@/hooks/crm/useUpdateSearchParams";
import type { ProcessFilterOptions } from "@/types/processes";

export function ProcessFilterBar({ filterOptions }: { filterOptions: ProcessFilterOptions }) {
  const { update, searchParams } = useUpdateSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  // biome-ignore lint/correctness/useExhaustiveDependencies: update é estável (ver useUpdateSearchParams); só o texto digitado deve reiniciar o debounce.
  useEffect(() => {
    const timeout = setTimeout(() => update({ search: search || null }), 300);
    return () => clearTimeout(timeout);
  }, [search]);

  return (
    <div className="crm-toolbar" style={{ flexWrap: "wrap" }}>
      <input
        type="text"
        className="crm-select"
        placeholder="Buscar processo…"
        style={{ width: 220 }}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        aria-label="Buscar"
      />

      <select
        className="crm-select"
        value={searchParams.get("categoryId") ?? ""}
        onChange={(e) => update({ categoryId: e.target.value || null })}
        aria-label="Categoria"
      >
        <option value="">Todas as categorias</option>
        {filterOptions.categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
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
        {PROCESS_STATUSES.map((status) => (
          <option key={status} value={status}>
            {PROCESS_STATUS_LABEL[status]}
          </option>
        ))}
      </select>

      <select
        className="crm-select"
        value={searchParams.get("ownerId") ?? ""}
        onChange={(e) => update({ ownerId: e.target.value || null })}
        aria-label="Responsável"
      >
        <option value="">Todos os responsáveis</option>
        {filterOptions.owners.map((owner) => (
          <option key={owner.id} value={owner.id}>
            {owner.name ?? "Sem nome"}
          </option>
        ))}
      </select>
    </div>
  );
}
