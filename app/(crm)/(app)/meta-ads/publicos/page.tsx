import type { Metadata } from "next";
import { fetchMetaAdsAudiencesPageData } from "@/application/metaAds/metaAdsQueries";
import { MetaAdsAudiencesList } from "@/components/metaAds/MetaAdsAudiencesList";
import { MetaAdsFilterBar } from "@/components/metaAds/MetaAdsFilterBar";

export const metadata: Metadata = {
  title: "Públicos — Meta Ads — Brusync OS",
};

export default async function MetaAdsAudiencesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const { audiences, adAccounts } = await fetchMetaAdsAudiencesPageData();

  const filtered = params.adAccountId
    ? audiences.filter((a) => a.adAccountId === params.adAccountId)
    : audiences;

  return (
    <div>
      <MetaAdsFilterBar adAccounts={adAccounts} />
      <div className="crm-card crm-card-pad reveal in">
        <MetaAdsAudiencesList audiences={filtered} />
      </div>
    </div>
  );
}
