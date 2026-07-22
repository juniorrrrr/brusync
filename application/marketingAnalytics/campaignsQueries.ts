import "server-only";

import {
  getMarketingDataset,
  groupBy,
  type MarketingQueryFilters,
} from "@/application/marketingAnalytics/dataset";
import { parseCampaignKey } from "@/domain/marketing/campaignKey";
import {
  computeRoas,
  computeRoi,
  knownMetric,
  UNAVAILABLE_METRIC,
} from "@/domain/marketing/metrics";
import { listCampaignSpend } from "@/repositories/marketing/campaignSpendRepository";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type { CampaignRow } from "@/types/marketing";

export type CampaignSortKey =
  | "leads"
  | "clients"
  | "revenue"
  | "roas"
  | "roi"
  | "investment"
  | "conversionRate";

export interface CampaignQueryOptions extends MarketingQueryFilters {
  search?: string;
  sortBy?: CampaignSortKey;
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface CampaignQueryResult {
  rows: CampaignRow[];
  total: number;
}

function sortValue(row: CampaignRow, sortBy: CampaignSortKey): number {
  switch (sortBy) {
    case "clients":
      return row.clients;
    case "revenue":
      return row.revenue;
    case "roas":
      return row.roas.value ?? Number.NEGATIVE_INFINITY;
    case "roi":
      return row.roi.value ?? Number.NEGATIVE_INFINITY;
    case "investment":
      return row.investment.value ?? Number.NEGATIVE_INFINITY;
    case "conversionRate":
      return row.conversionRate;
    default:
      return row.leads;
  }
}

export async function getCampaignRows(
  options: CampaignQueryOptions = {},
): Promise<CampaignQueryResult> {
  const {
    search,
    sortBy = "leads",
    sortDir = "desc",
    page = 1,
    pageSize = 20,
    ...datasetFilters
  } = options;

  const supabase = await getSupabaseAuthClient();
  const [{ leads }, spendEntries] = await Promise.all([
    getMarketingDataset(datasetFilters),
    listCampaignSpend(supabase, {
      periodFrom: datasetFilters.createdFrom,
      periodTo: datasetFilters.createdTo,
    }),
  ]);

  const spendByKey = new Map<string, number>();
  for (const entry of spendEntries) {
    const key = `${entry.utmSource}::${entry.utmCampaign}`;
    spendByKey.set(key, (spendByKey.get(key) ?? 0) + entry.amount);
  }

  const leadsByCampaign = groupBy(leads, (lead) => lead.campaignKey);

  let rows: CampaignRow[] = [...leadsByCampaign.entries()].map(([key, campaignLeads]) => {
    const { utmSource, utmCampaign } = parseCampaignKey(key);
    const clients = campaignLeads.filter((lead) => lead.clientCreatedAt !== null);
    const revenue = campaignLeads.reduce((sum, lead) => sum + lead.revenue, 0);
    const spendAmount = spendByKey.get(key);
    const investment = spendAmount !== undefined ? knownMetric(spendAmount) : UNAVAILABLE_METRIC;

    return {
      key,
      utmSource,
      utmCampaign,
      origin: campaignLeads[0].origin,
      investment,
      leads: campaignLeads.length,
      qualifiedLeads: campaignLeads.filter((lead) => lead.isQualifiedOrBeyond).length,
      clients: clients.length,
      revenue,
      roas: computeRoas(revenue, investment),
      roi: computeRoi(revenue, investment),
      conversionRate: campaignLeads.length > 0 ? (clients.length / campaignLeads.length) * 100 : 0,
    };
  });

  const term = search?.trim().toLowerCase();
  if (term) {
    rows = rows.filter(
      (row) =>
        row.utmCampaign?.toLowerCase().includes(term) ||
        row.utmSource?.toLowerCase().includes(term),
    );
  }

  const dir = sortDir === "asc" ? 1 : -1;
  rows.sort((a, b) => (sortValue(a, sortBy) - sortValue(b, sortBy)) * dir);

  const total = rows.length;
  const start = (page - 1) * pageSize;
  return { rows: rows.slice(start, start + pageSize), total };
}
