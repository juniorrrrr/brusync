import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { computeMetaAdsAlerts } from "@/domain/metaAds/alerts";
import { sumInsights } from "@/domain/metaAds/metrics";
import { getActiveMetaAccount } from "@/repositories/metaAds/accountsRepository";
import { listAdAccounts } from "@/repositories/metaAds/adAccountsRepository";
import { listDisapprovedAds } from "@/repositories/metaAds/adsRepository";
import { listCampaigns } from "@/repositories/metaAds/campaignsRepository";
import { listInsights } from "@/repositories/metaAds/insightsRepository";
import { listRecentFailedJobs } from "@/repositories/metaAds/syncJobsRepository";
import { getCurrentTokenSecret } from "@/repositories/metaAds/tokensRepository";
import type { MetaAdsAlert } from "@/types/metaAds";

/** Único ponto que decide o que vira alerta com dados reais — components/
 * metaAds/MetaAdsAlertsList.tsx só renderiza o que domain/metaAds/alerts.ts
 * já calculou. Usado tanto pelo dashboard quanto por uma eventual tela de
 * alertas dedicada, sem duplicar a consulta. */
export async function computeLiveMetaAdsAlerts(supabase: SupabaseClient): Promise<MetaAdsAlert[]> {
  const account = await getActiveMetaAccount(supabase);
  if (!account) return [];

  const adAccounts = await listAdAccounts(supabase, account.id);
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const until = new Date().toISOString().slice(0, 10);

  const campaignsWithLast7: {
    campaign: Awaited<ReturnType<typeof listCampaigns>>[number];
    last7Days: ReturnType<typeof sumInsights>;
  }[] = [];
  for (const adAccount of adAccounts) {
    const campaigns = await listCampaigns(supabase, { adAccountId: adAccount.id });
    for (const campaign of campaigns) {
      const rows = await listInsights(supabase, {
        adAccountId: adAccount.id,
        level: "campaign",
        since,
        until,
        campaignId: campaign.id,
      });
      campaignsWithLast7.push({ campaign, last7Days: sumInsights(rows) });
    }
  }

  const failedAds = await listDisapprovedAds(supabase);
  const recentFailedJobs = await listRecentFailedJobs(supabase, account.id);
  const tokenSecret = await getCurrentTokenSecret(supabase, account.id);

  return computeMetaAdsAlerts({
    account,
    campaigns: campaignsWithLast7,
    failedAds,
    recentFailedJobs,
    tokenExpiresAt: tokenSecret?.expires_at ?? null,
  });
}
