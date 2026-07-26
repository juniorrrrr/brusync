import type { Metadata } from "next";
import {
  fetchMetaAdsCampaignsPageData,
  fetchMetaAdsProjectOptions,
} from "@/application/metaAds/metaAdsQueries";
import { MetaAdsCampaignsTable } from "@/components/metaAds/MetaAdsCampaignsTable";
import { MetaAdsFilterBar } from "@/components/metaAds/MetaAdsFilterBar";

export const metadata: Metadata = {
  title: "Campanhas — Meta Ads — Brusync OS",
};

export default async function MetaAdsCampaignsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const [{ campaigns, adAccounts }, projectOptions] = await Promise.all([
    fetchMetaAdsCampaignsPageData(),
    fetchMetaAdsProjectOptions(),
  ]);

  const filtered = params.adAccountId
    ? campaigns.filter((c) => c.campaign.adAccountId === params.adAccountId)
    : campaigns;

  return (
    <div>
      <MetaAdsFilterBar adAccounts={adAccounts} />
      <div className="crm-card crm-card-pad reveal in">
        <MetaAdsCampaignsTable campaigns={filtered} projectOptions={projectOptions} />
      </div>
    </div>
  );
}
