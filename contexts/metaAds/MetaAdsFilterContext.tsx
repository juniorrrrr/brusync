"use client";

import { useSearchParams } from "next/navigation";
import { createContext, type ReactNode, useCallback, useContext, useMemo } from "react";
import { useUpdateSearchParams } from "@/hooks/crm/useUpdateSearchParams";
import type { MetaAdsFilters } from "@/types/metaAds";

interface MetaAdsFilterContextValue {
  filters: MetaAdsFilters;
  setFilter: <K extends keyof MetaAdsFilters>(key: K, value: MetaAdsFilters[K] | undefined) => void;
  isPending: boolean;
}

const MetaAdsFilterContext = createContext<MetaAdsFilterContextValue | null>(null);

/** Fonte única dos filtros (conta/business/campanha/período/status) —
 * mudar um filtro atualiza a URL via hooks/crm/useUpdateSearchParams.ts (o
 * mesmo hook que WhatsappFilterBar/ProcessFilterBar já usam, nada
 * reimplementado aqui); as páginas de Meta Ads (Server Components) leem o
 * `searchParams` da própria URL para buscar os dados. Este contexto só
 * evita prop-drilling do objeto de filtros entre widgets client-side
 * aninhados (ex.: tabela de campanhas reagindo ao filtro sem recarregar a
 * árvore inteira). */
export function MetaAdsFilterProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const { update, isPending } = useUpdateSearchParams();

  const filters: MetaAdsFilters = useMemo(
    () => ({
      adAccountId: searchParams.get("adAccountId") ?? undefined,
      businessId: searchParams.get("businessId") ?? undefined,
      campaignId: searchParams.get("campaignId") ?? undefined,
      adSetId: searchParams.get("adSetId") ?? undefined,
      objective: searchParams.get("objective") ?? undefined,
      status: (searchParams.get("status") as MetaAdsFilters["status"]) ?? undefined,
      responsibleId: searchParams.get("responsibleId") ?? undefined,
      clientId: searchParams.get("clientId") ?? undefined,
    }),
    [searchParams],
  );

  const setFilter = useCallback(
    <K extends keyof MetaAdsFilters>(key: K, value: MetaAdsFilters[K] | undefined) => {
      update({ [key]: value === undefined ? null : String(value) });
    },
    [update],
  );

  const value = useMemo(() => ({ filters, setFilter, isPending }), [filters, setFilter, isPending]);

  return <MetaAdsFilterContext.Provider value={value}>{children}</MetaAdsFilterContext.Provider>;
}

export function useMetaAdsFilters() {
  const ctx = useContext(MetaAdsFilterContext);
  if (!ctx) throw new Error("useMetaAdsFilters deve ser usado dentro de MetaAdsFilterProvider");
  return ctx;
}
