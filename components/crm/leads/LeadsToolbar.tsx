"use client";

import { useEffect, useState } from "react";
import { IconSearch } from "@/components/ui/icons";
import { useUpdateSearchParams } from "@/hooks/crm/useUpdateSearchParams";
import type { PipelineStage } from "@/types/crm";

export function LeadsToolbar({
  stages,
  owners,
  initialSearch,
  initialStageId,
  initialOwnerId,
}: {
  stages: PipelineStage[];
  owners: { id: string; name: string | null; email: string | null }[];
  initialSearch: string;
  initialStageId: string;
  initialOwnerId: string;
}) {
  const { update } = useUpdateSearchParams();
  const [search, setSearch] = useState(initialSearch);

  useEffect(() => {
    const timeout = setTimeout(() => {
      update({ q: search || null }, { resetPage: true });
    }, 350);
    return () => clearTimeout(timeout);
  }, [search, update]);

  return (
    <div className="crm-toolbar">
      <div className="crm-search">
        <IconSearch />
        <input
          type="text"
          placeholder="Buscar por nome, empresa ou e-mail…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <select
        className="crm-select"
        value={initialStageId}
        onChange={(e) => update({ stage: e.target.value || null }, { resetPage: true })}
      >
        <option value="">Todos os estágios</option>
        {stages.map((stage) => (
          <option key={stage.id} value={stage.id}>
            {stage.label}
          </option>
        ))}
      </select>

      <select
        className="crm-select"
        value={initialOwnerId}
        onChange={(e) => update({ owner: e.target.value || null }, { resetPage: true })}
      >
        <option value="">Todos os responsáveis</option>
        {owners.map((owner) => (
          <option key={owner.id} value={owner.id}>
            {owner.name || owner.email}
          </option>
        ))}
      </select>
    </div>
  );
}
