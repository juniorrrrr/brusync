import "server-only";

import {
  getMarketingDataset,
  groupBy,
  type MarketingQueryFilters,
} from "@/application/marketingAnalytics/dataset";
import { getDemoLandingPageRows } from "@/lib/demo/mockMarketing";
import { isDemoModeActive } from "@/services/demo/demoMode";
import type { LandingPageRow } from "@/types/marketing";

export async function getLandingPageRows(
  filters: MarketingQueryFilters = {},
): Promise<LandingPageRow[]> {
  if (await isDemoModeActive()) return getDemoLandingPageRows();

  const { leads } = await getMarketingDataset(filters);
  const withLanding = leads.filter((lead): lead is typeof lead & { landingPage: string } =>
    Boolean(lead.landingPage),
  );
  const grouped = groupBy(withLanding, (lead) => lead.landingPage);

  return [...grouped.entries()]
    .map(([landingPage, group]) => {
      const clients = group.filter((lead) => lead.clientCreatedAt !== null);
      const revenue = group.reduce((sum, lead) => sum + lead.revenue, 0);
      const timeSamples = clients
        .filter((lead) => lead.wonEnteredAt)
        .map(
          (lead) =>
            (new Date(lead.wonEnteredAt as string).getTime() - new Date(lead.createdAt).getTime()) /
            86_400_000,
        );

      return {
        landingPage,
        leads: group.length,
        clients: clients.length,
        revenue,
        conversionRate: group.length > 0 ? (clients.length / group.length) * 100 : 0,
        averageTimeToConvertDays:
          timeSamples.length > 0
            ? timeSamples.reduce((sum, days) => sum + days, 0) / timeSamples.length
            : null,
      } satisfies LandingPageRow;
    })
    .sort((a, b) => b.leads - a.leads);
}
