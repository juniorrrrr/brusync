import "server-only";

import {
  type EnrichedLead,
  getMarketingDataset,
  type MarketingQueryFilters,
} from "@/application/marketingAnalytics/dataset";
import type { UtmFacetCount, UtmFacets, UtmLeadRow } from "@/types/marketing";

function facet(
  leads: EnrichedLead[],
  pick: (lead: EnrichedLead) => string | null,
): UtmFacetCount[] {
  const counts = new Map<string, number>();
  for (const lead of leads) {
    const value = pick(lead);
    if (!value) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count);
}

export async function getUtmFacets(filters: MarketingQueryFilters = {}): Promise<UtmFacets> {
  const { leads } = await getMarketingDataset(filters);
  return {
    utmSource: facet(leads, (lead) => lead.utmSource),
    utmMedium: facet(leads, (lead) => lead.utmMedium),
    utmCampaign: facet(leads, (lead) => lead.utmCampaign),
    utmContent: facet(leads, (lead) => lead.utmContent),
    utmTerm: facet(leads, (lead) => lead.utmTerm),
  };
}

export interface UtmExplorerFilters extends MarketingQueryFilters {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
}

export async function getUtmLeads(filters: UtmExplorerFilters = {}): Promise<UtmLeadRow[]> {
  const { utmSource, utmMedium, utmCampaign, utmContent, utmTerm, ...datasetFilters } = filters;
  const { leads } = await getMarketingDataset(datasetFilters);

  return leads
    .filter(
      (lead) =>
        (!utmSource || lead.utmSource === utmSource) &&
        (!utmMedium || lead.utmMedium === utmMedium) &&
        (!utmCampaign || lead.utmCampaign === utmCampaign) &&
        (!utmContent || lead.utmContent === utmContent) &&
        (!utmTerm || lead.utmTerm === utmTerm),
    )
    .map((lead) => ({
      crmLeadId: lead.id,
      name: lead.name,
      company: lead.company,
      stageLabel: lead.stageLabel,
      stageColor: lead.stageColor,
      isWon: lead.isWon,
      isLost: lead.isLost,
      createdAt: lead.createdAt,
      utmSource: lead.utmSource,
      utmMedium: lead.utmMedium,
      utmCampaign: lead.utmCampaign,
      utmContent: lead.utmContent,
      utmTerm: lead.utmTerm,
    }));
}
