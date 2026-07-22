import type { Metadata } from "next";
import { parseMarketingFilters } from "@/application/marketingAnalytics/filters";
import { getOriginMetrics } from "@/application/marketingAnalytics/originsQueries";
import { OriginMetricCard } from "@/components/marketing/OriginMetricCard";

export const metadata: Metadata = {
  title: "Marketing · Origens — Brusync OS",
  robots: { index: false, follow: false },
};

export default async function MarketingOrigensPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const { filters } = parseMarketingFilters(params);
  const origins = await getOriginMetrics(filters);

  return (
    <div className="crm-mkt-origin-grid">
      {origins.map((origin) => (
        <OriginMetricCard key={origin.origin} origin={origin} />
      ))}
    </div>
  );
}
