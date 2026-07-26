"use client";

import { useState } from "react";
import { useAnalyticsDashboard } from "@/contexts/analytics/AnalyticsDashboardContext";
import { ANALYTICS_PERIOD_LABEL, ANALYTICS_PERIODS } from "@/domain/analytics/periods";
import { FILTER_KEY_LABEL } from "@/domain/analytics/statusMeta";
import type { AnalyticsFilterState } from "@/types/analytics";

type TextFilterKey = Exclude<
  keyof AnalyticsFilterState,
  "periodo" | "periodoInicio" | "periodoFim"
>;

const TEXT_FILTERS: TextFilterKey[] = [
  "cliente",
  "lead",
  "projeto",
  "origem",
  "campanha",
  "canal",
  "cidade",
  "status",
  "pipeline",
  "equipe",
];

export function AnalyticsFilterBar({
  owners,
}: {
  owners: { id: string; name: string | null; email: string | null }[];
}) {
  const { filters, updateFilters, isPending } = useAnalyticsDashboard();
  const [showMore, setShowMore] = useState(false);

  return (
    <div className="crm-card crm-card-pad crm-an-filter-bar">
      <div className="crm-ai-filter-bar">
        <div className="crm-field">
          <label htmlFor="an-filter-periodo">{FILTER_KEY_LABEL.periodo}</label>
          <select
            id="an-filter-periodo"
            value={filters.periodo}
            onChange={(e) => updateFilters({ periodo: e.target.value as typeof filters.periodo })}
          >
            {ANALYTICS_PERIODS.map((period) => (
              <option key={period} value={period}>
                {ANALYTICS_PERIOD_LABEL[period]}
              </option>
            ))}
          </select>
        </div>

        <div className="crm-field">
          <label htmlFor="an-filter-responsavel">{FILTER_KEY_LABEL.responsavel}</label>
          <select
            id="an-filter-responsavel"
            value={filters.responsavel ?? ""}
            onChange={(e) => updateFilters({ responsavel: e.target.value || null })}
          >
            <option value="">Todos</option>
            {owners.map((owner) => (
              <option key={owner.id} value={owner.id}>
                {owner.name ?? owner.email}
              </option>
            ))}
          </select>
        </div>

        <button type="button" className="btn btn-outline" onClick={() => setShowMore((v) => !v)}>
          {showMore ? "Menos filtros" : "Mais filtros"}
        </button>
        {isPending && <span className="crm-card-sub">Atualizando…</span>}
      </div>

      {showMore && (
        <div className="crm-ai-filter-bar" style={{ marginTop: 10 }}>
          {TEXT_FILTERS.map((key) => (
            <div className="crm-field" key={key}>
              <label htmlFor={`an-filter-${key}`}>{FILTER_KEY_LABEL[key]}</label>
              <input
                id={`an-filter-${key}`}
                defaultValue={filters[key] ?? ""}
                onBlur={(e) => updateFilters({ [key]: e.target.value || null })}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
