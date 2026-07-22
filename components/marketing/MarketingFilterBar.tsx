"use client";

import { useEffect, useState } from "react";
import { MARKETING_ORIGIN_LABEL, MARKETING_ORIGINS } from "@/domain/marketing/originRules";
import { PERIOD_LABEL, PERIOD_OPTIONS } from "@/domain/marketing/period";
import { useUpdateSearchParams } from "@/hooks/crm/useUpdateSearchParams";
import type { PipelineStage } from "@/types/crm";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Todos os status" },
  { value: "aberto", label: "Aberto" },
  { value: "ganho", label: "Ganho" },
  { value: "perdido", label: "Perdido" },
];

export function MarketingFilterBar({
  owners,
  stages,
}: {
  owners: { id: string; name: string | null; email: string | null }[];
  stages: PipelineStage[];
}) {
  const { update, searchParams } = useUpdateSearchParams();
  const [campaign, setCampaign] = useState(searchParams.get("campaign") ?? "");
  const [city, setCity] = useState(searchParams.get("city") ?? "");

  useEffect(() => {
    const timeout = setTimeout(() => update({ campaign: campaign || null }), 350);
    return () => clearTimeout(timeout);
  }, [campaign, update]);

  useEffect(() => {
    const timeout = setTimeout(() => update({ city: city || null }), 350);
    return () => clearTimeout(timeout);
  }, [city, update]);

  return (
    <div className="crm-toolbar">
      <select
        className="crm-select"
        value={searchParams.get("period") ?? "30d"}
        onChange={(e) => update({ period: e.target.value })}
        aria-label="Período"
      >
        {PERIOD_OPTIONS.map((preset) => (
          <option key={preset} value={preset}>
            {PERIOD_LABEL[preset]}
          </option>
        ))}
      </select>

      <select
        className="crm-select"
        value={searchParams.get("origin") ?? ""}
        onChange={(e) => update({ origin: e.target.value || null })}
        aria-label="Origem"
      >
        <option value="">Todas as origens</option>
        {MARKETING_ORIGINS.map((origin) => (
          <option key={origin} value={origin}>
            {MARKETING_ORIGIN_LABEL[origin]}
          </option>
        ))}
      </select>

      <input
        type="text"
        className="crm-select"
        placeholder="Campanha"
        style={{ width: 140, fontWeight: 500 }}
        value={campaign}
        onChange={(e) => setCampaign(e.target.value)}
      />

      <select
        className="crm-select"
        value={searchParams.get("owner") ?? ""}
        onChange={(e) => update({ owner: e.target.value || null })}
        aria-label="Responsável"
      >
        <option value="">Todos os responsáveis</option>
        {owners.map((owner) => (
          <option key={owner.id} value={owner.id}>
            {owner.name || owner.email}
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

      <select
        className="crm-select"
        value={searchParams.get("stage") ?? ""}
        onChange={(e) => update({ stage: e.target.value || null })}
        aria-label="Pipeline"
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
        value={searchParams.get("status") ?? ""}
        onChange={(e) => update({ status: e.target.value || null })}
        aria-label="Status"
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
