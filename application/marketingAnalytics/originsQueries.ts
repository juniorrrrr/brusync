import "server-only";

import {
  getMarketingDataset,
  groupBy,
  type MarketingQueryFilters,
} from "@/application/marketingAnalytics/dataset";
import { computeRoas, sumInvestment, UNAVAILABLE_METRIC } from "@/domain/marketing/metrics";
import {
  classifyMarketingOrigin,
  MARKETING_ORIGIN_LABEL,
  MARKETING_ORIGINS,
} from "@/domain/marketing/originRules";
import { listCampaignSpend } from "@/repositories/marketing/campaignSpendRepository";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type { MarketingOrigin, OriginMetrics } from "@/types/marketing";

export async function getOriginMetrics(
  filters: MarketingQueryFilters = {},
): Promise<OriginMetrics[]> {
  const supabase = await getSupabaseAuthClient();
  const [{ leads }, spendEntries] = await Promise.all([
    getMarketingDataset(filters),
    listCampaignSpend(supabase, { periodFrom: filters.createdFrom, periodTo: filters.createdTo }),
  ]);

  const leadsByOrigin = groupBy(leads, (lead) => lead.origin);

  // Manual spend entries only carry utm_source/utm_campaign — classified
  // into the same origin buckets using utm_source alone (click IDs and
  // referer aren't captured on a manual investment entry).
  const investmentByOrigin = new Map<MarketingOrigin, number[]>();
  for (const entry of spendEntries) {
    const origin = classifyMarketingOrigin({
      utmSource: entry.utmSource,
      utmMedium: null,
      referer: null,
      gclid: null,
      fbclid: null,
      msclkid: null,
      ttclid: null,
      manualOrigin: null,
    });
    const list = investmentByOrigin.get(origin) ?? [];
    list.push(entry.amount);
    investmentByOrigin.set(origin, list);
  }

  return MARKETING_ORIGINS.map((origin) => {
    const originLeads = leadsByOrigin.get(origin) ?? [];
    const clients = originLeads.filter((lead) => lead.clientCreatedAt !== null);
    const revenue = originLeads.reduce((sum, lead) => sum + lead.revenue, 0);
    const amounts = investmentByOrigin.get(origin);
    const investment = amounts
      ? sumInvestment(amounts.map((value) => ({ value, available: true })))
      : UNAVAILABLE_METRIC;

    return {
      origin,
      label: MARKETING_ORIGIN_LABEL[origin],
      leads: originLeads.length,
      clients: clients.length,
      revenue,
      conversionRate: originLeads.length > 0 ? (clients.length / originLeads.length) * 100 : 0,
      investment,
      roas: computeRoas(revenue, investment),
    };
  });
}
