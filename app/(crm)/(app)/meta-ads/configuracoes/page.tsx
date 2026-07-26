import type { Metadata } from "next";
import {
  fetchMetaAdsClientOptions,
  fetchMetaAdsResponsibleOptions,
  fetchMetaAdsSettingsPageData,
} from "@/application/metaAds/metaAdsQueries";
import { MetaAdsAccountConnectPanel } from "@/components/metaAds/MetaAdsAccountConnectPanel";
import { MetaAdsSyncStatusPanel } from "@/components/metaAds/MetaAdsSyncStatusPanel";

export const metadata: Metadata = {
  title: "Configurações — Meta Ads — Brusync OS",
};

export default async function MetaAdsSettingsPage() {
  const [settings, clientOptions, responsibleOptions] = await Promise.all([
    fetchMetaAdsSettingsPageData(),
    fetchMetaAdsClientOptions(),
    fetchMetaAdsResponsibleOptions(),
  ]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <MetaAdsAccountConnectPanel
        account={settings.account}
        businesses={settings.businesses}
        adAccounts={settings.adAccounts}
        clientOptions={clientOptions}
        responsibleOptions={responsibleOptions}
        oauthConfigured={settings.oauthConfigured}
      />
      {settings.account && (
        <MetaAdsSyncStatusPanel accountId={settings.account.id} jobs={settings.recentJobs} />
      )}
    </div>
  );
}
