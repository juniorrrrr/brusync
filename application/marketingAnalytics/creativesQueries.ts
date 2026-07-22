import "server-only";

import {
  getMarketingDataset,
  groupBy,
  type MarketingQueryFilters,
} from "@/application/marketingAnalytics/dataset";
import type { CreativeRow } from "@/types/marketing";

/** "Criativos" — only leads carrying a click ID (gclid/fbclid/msclkid/ttclid)
 * are considered, grouped by utm_content ("Criativo") + utm_term
 * ("Conjunto"). This is a UTM-based proxy, not real ad-platform creative
 * data — there's no Meta/Google Ads API integration yet (Fase 5 notes). */
export async function getCreativeRows(filters: MarketingQueryFilters = {}): Promise<CreativeRow[]> {
  const { leads } = await getMarketingDataset(filters);
  const withClickId = leads.filter(
    (lead) => lead.gclid || lead.fbclid || lead.msclkid || lead.ttclid,
  );
  const grouped = groupBy(
    withClickId,
    (lead) => `${lead.utmContent ?? ""}::${lead.utmTerm ?? ""}::${lead.utmCampaign ?? ""}`,
  );

  return [...grouped.values()]
    .map((group) => {
      const clients = group.filter((lead) => lead.clientCreatedAt !== null);
      const revenue = group.reduce((sum, lead) => sum + lead.revenue, 0);

      return {
        key: `${group[0].utmContent ?? ""}::${group[0].utmTerm ?? ""}::${group[0].utmCampaign ?? ""}`,
        utmContent: group[0].utmContent,
        utmTerm: group[0].utmTerm,
        utmCampaign: group[0].utmCampaign,
        leads: group.length,
        clients: clients.length,
        revenue,
        conversionRate: group.length > 0 ? (clients.length / group.length) * 100 : 0,
      } satisfies CreativeRow;
    })
    .sort((a, b) => b.leads - a.leads);
}
