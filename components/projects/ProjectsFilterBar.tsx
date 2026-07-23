"use client";

import { useEffect, useState } from "react";
import { PROJECT_STATUS_LABEL, PROJECT_STATUSES } from "@/domain/projects/types";
import { useUpdateSearchParams } from "@/hooks/crm/useUpdateSearchParams";
import type { OwnerRef } from "@/types/crm";

export function ProjectsFilterBar({
  owners,
  clients,
}: {
  owners: OwnerRef[];
  clients: { id: string; company: string }[];
}) {
  const { update, searchParams } = useUpdateSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") ?? "");

  // biome-ignore lint/correctness/useExhaustiveDependencies: update is stable (see useUpdateSearchParams); only search should re-trigger the debounce.
  useEffect(() => {
    const timeout = setTimeout(() => update({ q: search || null }), 300);
    return () => clearTimeout(timeout);
  }, [search]);

  return (
    <div className="crm-toolbar" style={{ flexWrap: "wrap" }}>
      <input
        type="text"
        className="crm-select"
        placeholder="Buscar por nome do projeto ou cliente…"
        style={{ width: 240 }}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        aria-label="Buscar"
      />

      <select
        className="crm-select"
        value={searchParams.get("ownerId") ?? ""}
        onChange={(e) => update({ ownerId: e.target.value || null })}
        aria-label="Responsável"
      >
        <option value="">Todos os responsáveis</option>
        {owners.map((owner) => (
          <option key={owner.id} value={owner.id}>
            {owner.name || owner.email}
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
        {PROJECT_STATUSES.map((status) => (
          <option key={status} value={status}>
            {PROJECT_STATUS_LABEL[status]}
          </option>
        ))}
      </select>

      <select
        className="crm-select"
        value={searchParams.get("clientId") ?? ""}
        onChange={(e) => update({ clientId: e.target.value || null })}
        aria-label="Cliente"
      >
        <option value="">Todos os clientes</option>
        {clients.map((client) => (
          <option key={client.id} value={client.id}>
            {client.company}
          </option>
        ))}
      </select>

      <span className="crm-card-sub" style={{ margin: 0 }}>
        Criado
      </span>
      <input
        type="date"
        className="crm-select"
        value={searchParams.get("createdFrom") ?? ""}
        onChange={(e) => update({ createdFrom: e.target.value || null })}
        aria-label="Criado de"
      />
      <input
        type="date"
        className="crm-select"
        value={searchParams.get("createdTo") ?? ""}
        onChange={(e) => update({ createdTo: e.target.value || null })}
        aria-label="Criado até"
      />

      <span className="crm-card-sub" style={{ margin: 0 }}>
        Prazo
      </span>
      <input
        type="date"
        className="crm-select"
        value={searchParams.get("dueFrom") ?? ""}
        onChange={(e) => update({ dueFrom: e.target.value || null })}
        aria-label="Prazo de"
      />
      <input
        type="date"
        className="crm-select"
        value={searchParams.get("dueTo") ?? ""}
        onChange={(e) => update({ dueTo: e.target.value || null })}
        aria-label="Prazo até"
      />
    </div>
  );
}
