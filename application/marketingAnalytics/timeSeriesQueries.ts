import "server-only";

import {
  getMarketingDataset,
  type MarketingQueryFilters,
} from "@/application/marketingAnalytics/dataset";

export interface TimeSeriesPoint {
  date: string;
  leads: number;
  revenue: number;
}

export async function getMarketingTimeSeries(
  filters: MarketingQueryFilters = {},
): Promise<TimeSeriesPoint[]> {
  const { leads } = await getMarketingDataset(filters);

  const buckets = new Map<string, { leads: number; revenue: number }>();
  for (const lead of leads) {
    const key = lead.createdAt.slice(0, 10);
    const bucket = buckets.get(key) ?? { leads: 0, revenue: 0 };
    bucket.leads += 1;
    bucket.revenue += lead.revenue;
    buckets.set(key, bucket);
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, bucket]) => ({ date, leads: bucket.leads, revenue: bucket.revenue }));
}
