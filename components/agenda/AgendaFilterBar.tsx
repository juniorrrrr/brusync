"use client";

import { useEffect, useState } from "react";
import {
  AGENDA_EVENT_TYPE_LABEL,
  AGENDA_RANGE_FILTERS,
  AGENDA_RANGE_LABEL,
} from "@/domain/agenda/types";
import { useUpdateSearchParams } from "@/hooks/crm/useUpdateSearchParams";
import type { OwnerRef, PipelineStage } from "@/types/crm";

const TYPE_OPTIONS = Object.entries(AGENDA_EVENT_TYPE_LABEL);

export function AgendaFilterBar({
  owners,
  pipelineStages,
}: {
  owners: OwnerRef[];
  pipelineStages: PipelineStage[];
}) {
  const { update, searchParams } = useUpdateSearchParams();
  const activeRange = searchParams.get("range") ?? "hoje";
  const [search, setSearch] = useState(searchParams.get("q") ?? "");

  // biome-ignore lint/correctness/useExhaustiveDependencies: update is stable (see useUpdateSearchParams); only search should re-trigger the debounce.
  useEffect(() => {
    const timeout = setTimeout(() => update({ q: search || null }), 300);
    return () => clearTimeout(timeout);
  }, [search]);

  return (
    <div>
      <div
        role="tablist"
        aria-label="Período"
        className="bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center gap-1 rounded-lg p-[3px] overflow-x-auto max-w-full"
      >
        {AGENDA_RANGE_FILTERS.map((range) => {
          const isActive = activeRange === range;
          return (
            <button
              type="button"
              key={range}
              role="tab"
              aria-selected={isActive}
              onClick={() => update({ range })}
              className={`inline-flex h-[calc(100%-1px)] items-center justify-center gap-1.5 rounded-md border border-transparent px-3.5 py-1 text-sm font-medium whitespace-nowrap transition-colors ${
                isActive ? "bg-background text-foreground shadow-sm" : "hover:text-foreground"
              }`}
            >
              {AGENDA_RANGE_LABEL[range]}
            </button>
          );
        })}
      </div>

      <div className="crm-toolbar" style={{ marginTop: 12 }}>
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
          value={searchParams.get("stageKey") ?? ""}
          onChange={(e) => update({ stageKey: e.target.value || null })}
          aria-label="Pipeline"
        >
          <option value="">Todos os estágios</option>
          {pipelineStages.map((stage) => (
            <option key={stage.id} value={stage.key}>
              {stage.label}
            </option>
          ))}
        </select>

        <select
          className="crm-select"
          value={searchParams.get("eventType") ?? ""}
          onChange={(e) => update({ eventType: e.target.value || null })}
          aria-label="Tipo de evento"
        >
          <option value="">Todos os tipos</option>
          {TYPE_OPTIONS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <input
          type="text"
          className="crm-select"
          placeholder="Buscar por lead ou título…"
          style={{ width: 220 }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Buscar"
        />
      </div>
    </div>
  );
}
