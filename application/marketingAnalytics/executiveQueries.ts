import "server-only";

import {
  getMarketingDataset,
  type MarketingQueryFilters,
} from "@/application/marketingAnalytics/dataset";
import { getTotalInvestment } from "@/application/marketingAnalytics/spend";
import { computeCac, computeRoas, computeRoi } from "@/domain/marketing/metrics";
import { getDemoExecutiveMetrics } from "@/lib/demo/mockMarketing";
import { isDemoModeActive } from "@/services/demo/demoMode";
import type { ExecutiveMetrics } from "@/types/marketing";

function daysBetween(a: string, b: string): number {
  return (new Date(b).getTime() - new Date(a).getTime()) / 86_400_000;
}

export async function getExecutiveMetrics(
  filters: MarketingQueryFilters = {},
): Promise<ExecutiveMetrics> {
  if (await isDemoModeActive()) return getDemoExecutiveMetrics();

  const [{ leads }, totalInvestment] = await Promise.all([
    getMarketingDataset(filters),
    getTotalInvestment(
      filters.createdFrom,
      filters.createdTo,
      filters.origin,
      filters.campaignSearch,
    ),
  ]);

  const totalRevenue = leads.reduce((sum, lead) => sum + lead.revenue, 0);
  const clients = leads.filter((lead) => lead.clientCreatedAt !== null);
  const wonLeadsWithRevenue = leads.filter((lead) => lead.revenue > 0);

  const timeToWinSamples = leads
    .filter((lead) => lead.wonEnteredAt)
    .map((lead) => daysBetween(lead.createdAt, lead.wonEnteredAt as string));

  return {
    totalInvestment,
    totalRevenue,
    roas: computeRoas(totalRevenue, totalInvestment),
    roi: computeRoi(totalRevenue, totalInvestment),
    cac: computeCac(clients.length, totalInvestment),
    leadsCount: leads.length,
    qualifiedLeadsCount: leads.filter((lead) => lead.isQualifiedOrBeyond).length,
    clientsCount: clients.length,
    averageTicket:
      wonLeadsWithRevenue.length > 0
        ? wonLeadsWithRevenue.reduce((sum, lead) => sum + lead.revenue, 0) /
          wonLeadsWithRevenue.length
        : null,
    conversionRate: leads.length > 0 ? (clients.length / leads.length) * 100 : 0,
    averageTimeToWinDays:
      timeToWinSamples.length > 0
        ? timeToWinSamples.reduce((sum, days) => sum + days, 0) / timeToWinSamples.length
        : null,
  };
}
