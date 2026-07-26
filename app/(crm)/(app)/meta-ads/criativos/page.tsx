import type { Metadata } from "next";
import { fetchMetaAdsCreativesPageData } from "@/application/metaAds/metaAdsQueries";
import { MetaAdsCreativesGrid } from "@/components/metaAds/MetaAdsCreativesGrid";
import { MetaAdsFilterBar } from "@/components/metaAds/MetaAdsFilterBar";

export const metadata: Metadata = {
  title: "Criativos — Meta Ads — Brusync OS",
};

export default async function MetaAdsCreativesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const { creatives, adAccounts } = await fetchMetaAdsCreativesPageData();

  const filtered = params.adAccountId
    ? creatives.filter((c) => c.adAccountId === params.adAccountId)
    : creatives;

  return (
    <div>
      <MetaAdsFilterBar adAccounts={adAccounts} />
      <MetaAdsCreativesGrid creatives={filtered} />
    </div>
  );
}
