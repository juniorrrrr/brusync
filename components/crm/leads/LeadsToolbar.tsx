"use client";

import { useEffect, useState } from "react";
import { IconSearch } from "@/components/ui/icons";
import { useUpdateSearchParams } from "@/hooks/crm/useUpdateSearchParams";
import type { LeadStatusFilter } from "@/repositories/crm/leadsRepository";
import type { PipelineStage } from "@/types/crm";

const STATUS_OPTIONS: { value: LeadStatusFilter | ""; label: string }[] = [
  { value: "", label: "Todos os status" },
  { value: "aberto", label: "Aberto" },
  { value: "ganho", label: "Ganho" },
  { value: "perdido", label: "Perdido" },
];

export function LeadsToolbar({
  stages,
  owners,
  initialSearch,
  initialStageId,
  initialOwnerId,
  initialCity,
  initialStatus,
  initialTag,
  initialScoreMin,
  initialScoreMax,
  initialCreatedFrom,
  initialCreatedTo,
}: {
  stages: PipelineStage[];
  owners: { id: string; name: string | null; email: string | null }[];
  initialSearch: string;
  initialStageId: string;
  initialOwnerId: string;
  initialCity: string;
  initialStatus: string;
  initialTag: string;
  initialScoreMin: string;
  initialScoreMax: string;
  initialCreatedFrom: string;
  initialCreatedTo: string;
}) {
  const { update } = useUpdateSearchParams();
  const [search, setSearch] = useState(initialSearch);
  const [city, setCity] = useState(initialCity);
  const [tag, setTag] = useState(initialTag);
  const [scoreMin, setScoreMin] = useState(initialScoreMin);
  const [scoreMax, setScoreMax] = useState(initialScoreMax);

  useEffect(() => {
    const timeout = setTimeout(() => {
      update({ q: search || null }, { resetPage: true });
    }, 350);
    return () => clearTimeout(timeout);
  }, [search, update]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      update({ city: city || null }, { resetPage: true });
    }, 350);
    return () => clearTimeout(timeout);
  }, [city, update]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      update({ tag: tag || null }, { resetPage: true });
    }, 350);
    return () => clearTimeout(timeout);
  }, [tag, update]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      update({ scoreMin: scoreMin || null, scoreMax: scoreMax || null }, { resetPage: true });
    }, 350);
    return () => clearTimeout(timeout);
  }, [scoreMin, scoreMax, update]);

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

      <select
        className="crm-select"
        value={initialStatus}
        onChange={(e) => update({ status: e.target.value || null }, { resetPage: true })}
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <input
        type="text"
        className="crm-select"
        placeholder="Cidade"
        style={{ width: 120, fontWeight: 500 }}
        value={city}
        onChange={(e) => setCity(e.target.value)}
      />

      <input
        type="text"
        className="crm-select"
        placeholder="Tag"
        style={{ width: 100, fontWeight: 500 }}
        value={tag}
        onChange={(e) => setTag(e.target.value)}
      />

      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <input
          type="number"
          className="crm-select"
          placeholder="Score mín."
          style={{ width: 90, fontWeight: 500 }}
          min={0}
          max={100}
          value={scoreMin}
          onChange={(e) => setScoreMin(e.target.value)}
        />
        <span className="cell-muted">–</span>
        <input
          type="number"
          className="crm-select"
          placeholder="máx."
          style={{ width: 90, fontWeight: 500 }}
          min={0}
          max={100}
          value={scoreMax}
          onChange={(e) => setScoreMax(e.target.value)}
        />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <input
          type="date"
          className="crm-select"
          style={{ fontWeight: 500 }}
          value={initialCreatedFrom}
          onChange={(e) => update({ createdFrom: e.target.value || null }, { resetPage: true })}
        />
        <span className="cell-muted">até</span>
        <input
          type="date"
          className="crm-select"
          style={{ fontWeight: 500 }}
          value={initialCreatedTo}
          onChange={(e) => update({ createdTo: e.target.value || null }, { resetPage: true })}
        />
      </div>
    </div>
  );
}
