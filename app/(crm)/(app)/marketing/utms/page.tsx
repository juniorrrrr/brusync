import type { Metadata } from "next";
import { parseMarketingFilters } from "@/application/marketingAnalytics/filters";
import { getUtmFacets, getUtmLeads } from "@/application/marketingAnalytics/utmExplorerQueries";
import { UtmExplorer } from "@/components/marketing/UtmExplorer";

export const metadata: Metadata = {
  title: "Marketing · UTMs — Brusync OS",
  robots: { index: false, follow: false },
};

export default async function MarketingUtmsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const { filters } = parseMarketingFilters(params);

  const selected = {
    utm_source: params.utm_source,
    utm_medium: params.utm_medium,
    utm_campaign: params.utm_campaign,
    utm_content: params.utm_content,
    utm_term: params.utm_term,
  };

  const [facets, leads] = await Promise.all([
    getUtmFacets(filters),
    getUtmLeads({
      ...filters,
      utmSource: params.utm_source,
      utmMedium: params.utm_medium,
      utmCampaign: params.utm_campaign,
      utmContent: params.utm_content,
      utmTerm: params.utm_term,
    }),
  ]);

  return <UtmExplorer facets={facets} leads={leads} selected={selected} />;
}
