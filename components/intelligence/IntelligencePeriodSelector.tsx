"use client";

import { INTELLIGENCE_PERIOD_LABEL, INTELLIGENCE_PERIODS } from "@/domain/intelligence/periods";
import { useUpdateSearchParams } from "@/hooks/crm/useUpdateSearchParams";
import type { IntelligencePeriodKey } from "@/types/intelligence";

export function IntelligencePeriodSelector() {
  const { update, searchParams } = useUpdateSearchParams();
  const period = (searchParams.get("period") as IntelligencePeriodKey) || "30d";

  return (
    <div className="crm-toolbar" style={{ flexWrap: "wrap" }}>
      <select
        className="crm-select"
        value={period}
        onChange={(e) => update({ period: e.target.value, from: null, to: null })}
        aria-label="Período"
      >
        {INTELLIGENCE_PERIODS.map((key) => (
          <option key={key} value={key}>
            {INTELLIGENCE_PERIOD_LABEL[key]}
          </option>
        ))}
      </select>

      {period === "personalizado" && (
        <>
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
        </>
      )}
    </div>
  );
}
