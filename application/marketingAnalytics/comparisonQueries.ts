import "server-only";

import { getExecutiveMetrics } from "@/application/marketingAnalytics/executiveQueries";
import { percentChange, previousPeriod, resolvePeriodPreset } from "@/domain/marketing/period";
import type { ExecutiveMetrics, MarketingPeriodPreset } from "@/types/marketing";

export interface ExecutiveComparison {
  preset: MarketingPeriodPreset;
  current: ExecutiveMetrics;
  previous: ExecutiveMetrics;
  changes: {
    totalRevenue: number | null;
    leadsCount: number | null;
    clientsCount: number | null;
    conversionRate: number | null;
  };
}

/** "Comparativos" — current period vs. the immediately-preceding period of
 * equal length. */
export async function getExecutiveComparison(
  preset: MarketingPeriodPreset,
): Promise<ExecutiveComparison> {
  const current = resolvePeriodPreset(preset);
  const previous = previousPeriod(current);

  const [currentMetrics, previousMetrics] = await Promise.all([
    getExecutiveMetrics({
      createdFrom: current.from.toISOString(),
      createdTo: current.to.toISOString(),
    }),
    getExecutiveMetrics({
      createdFrom: previous.from.toISOString(),
      createdTo: previous.to.toISOString(),
    }),
  ]);

  return {
    preset,
    current: currentMetrics,
    previous: previousMetrics,
    changes: {
      totalRevenue: percentChange(currentMetrics.totalRevenue, previousMetrics.totalRevenue),
      leadsCount: percentChange(currentMetrics.leadsCount, previousMetrics.leadsCount),
      clientsCount: percentChange(currentMetrics.clientsCount, previousMetrics.clientsCount),
      conversionRate: percentChange(currentMetrics.conversionRate, previousMetrics.conversionRate),
    },
  };
}
