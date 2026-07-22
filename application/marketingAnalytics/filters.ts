import "server-only";

import type { MarketingQueryFilters } from "@/application/marketingAnalytics/dataset";
import { MARKETING_ORIGINS } from "@/domain/marketing/originRules";
import { PERIOD_OPTIONS, resolvePeriodPreset } from "@/domain/marketing/period";
import type { MarketingOrigin, MarketingPeriodPreset } from "@/types/marketing";

export interface MarketingSearchParams {
  period?: string;
  origin?: string;
  campaign?: string;
  owner?: string;
  city?: string;
  stage?: string;
  status?: string;
}

export interface ResolvedMarketingFilters {
  preset: MarketingPeriodPreset;
  filters: MarketingQueryFilters;
}

const DEFAULT_PRESET: MarketingPeriodPreset = "30d";

/** Shared "Filtros Globais" parser — every Marketing Intelligence page reads
 * its URL search params through this so Período/Origem/Campanha/
 * Responsável/Cidade/Pipeline/Status behave identically everywhere. */
export function parseMarketingFilters(params: MarketingSearchParams): ResolvedMarketingFilters {
  const preset = PERIOD_OPTIONS.includes(params.period as MarketingPeriodPreset)
    ? (params.period as MarketingPeriodPreset)
    : DEFAULT_PRESET;
  const { from, to } = resolvePeriodPreset(preset);

  const origin = MARKETING_ORIGINS.includes(params.origin as MarketingOrigin)
    ? (params.origin as MarketingOrigin)
    : undefined;

  return {
    preset,
    filters: {
      createdFrom: from.toISOString(),
      createdTo: to.toISOString(),
      origin,
      campaignSearch: params.campaign || undefined,
      ownerId: params.owner || undefined,
      city: params.city || undefined,
      stageId: params.stage || undefined,
      status: (params.status as MarketingQueryFilters["status"]) || undefined,
    },
  };
}
