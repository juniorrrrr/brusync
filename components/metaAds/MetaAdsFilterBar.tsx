"use client";

import { useMetaAdsFilters } from "@/contexts/metaAds/MetaAdsFilterContext";
import type { MetaAdAccount } from "@/types/metaAds";

export function MetaAdsFilterBar({ adAccounts }: { adAccounts: MetaAdAccount[] }) {
  const { filters, setFilter } = useMetaAdsFilters();

  if (adAccounts.length <= 1) return null;

  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
      <select
        className="crm-select"
        value={filters.adAccountId ?? ""}
        onChange={(e) => setFilter("adAccountId", e.target.value || undefined)}
        aria-label="Conta de anúncios"
      >
        <option value="">Todas as contas</option>
        {adAccounts.map((acc) => (
          <option key={acc.id} value={acc.id}>
            {acc.name}
          </option>
        ))}
      </select>
    </div>
  );
}
