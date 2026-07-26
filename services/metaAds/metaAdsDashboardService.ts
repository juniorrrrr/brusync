import "server-only";

import { deriveMetrics, sumInsights } from "@/domain/metaAds/metrics";
import { getDemoMetaAdsDashboardData } from "@/lib/demo/mockMetaAds";
import { getActiveMetaAccount } from "@/repositories/metaAds/accountsRepository";
import { listAdAccounts } from "@/repositories/metaAds/adAccountsRepository";
import { listCampaigns } from "@/repositories/metaAds/campaignsRepository";
import {
  listCampaignInsightTotals,
  listDailySpend,
} from "@/repositories/metaAds/insightsRepository";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { computeLiveMetaAdsAlerts } from "@/services/metaAds/metaAdsAlertsService";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type { MetaAdsCampaignSummary, MetaAdsDashboardData } from "@/types/metaAds";

const DASHBOARD_WINDOW_DAYS = 30;

export interface GetDashboardDataOptions {
  adAccountId?: string;
}

export async function getMetaAdsDashboardData(
  options: GetDashboardDataOptions = {},
): Promise<MetaAdsDashboardData> {
  if (await isDemoModeActive()) return getDemoMetaAdsDashboardData();

  const supabase = await getSupabaseAuthClient();
  const account = await getActiveMetaAccount(supabase);
  if (!account) {
    return {
      account: null,
      adAccounts: [],
      summary: {
        spend: 0,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        leads: 0,
        purchases: 0,
        revenue: 0,
        metrics: { ctr: null, cpm: null, cpc: null, cpa: null, roas: null, roi: null },
        activeCampaigns: 0,
        pausedCampaigns: 0,
      },
      dailySpend: [],
      topCampaigns: [],
      worstCampaigns: [],
      alerts: [],
      lastSyncAt: null,
    };
  }

  const adAccounts = await listAdAccounts(supabase, account.id);
  const activeAdAccount =
    adAccounts.find((a) => a.id === options.adAccountId) ?? adAccounts[0] ?? null;

  const since = new Date(Date.now() - DASHBOARD_WINDOW_DAYS * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const until = new Date().toISOString().slice(0, 10);

  if (!activeAdAccount) {
    const alerts = await computeLiveMetaAdsAlerts(supabase);
    return {
      account,
      adAccounts: [],
      summary: {
        spend: 0,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        leads: 0,
        purchases: 0,
        revenue: 0,
        metrics: { ctr: null, cpm: null, cpc: null, cpa: null, roas: null, roi: null },
        activeCampaigns: 0,
        pausedCampaigns: 0,
      },
      dailySpend: [],
      topCampaigns: [],
      worstCampaigns: [],
      alerts,
      lastSyncAt: account.lastSyncAt,
    };
  }

  const [campaigns, campaignTotals, dailySpend, alerts] = await Promise.all([
    listCampaigns(supabase, { adAccountId: activeAdAccount.id }),
    listCampaignInsightTotals(supabase, activeAdAccount.id, since, until),
    listDailySpend(supabase, activeAdAccount.id, since, until),
    computeLiveMetaAdsAlerts(supabase),
  ]);

  const summaries: MetaAdsCampaignSummary[] = campaigns.map((campaign) => {
    const raw = campaignTotals.get(campaign.id) ?? {
      date: since,
      impressions: 0,
      reach: 0,
      frequency: null,
      clicks: 0,
      spend: 0,
      conversions: 0,
      leads: 0,
      purchases: 0,
      revenue: 0,
    };
    return {
      campaign,
      summary: {
        ...raw,
        metrics: deriveMetrics(raw),
        activeCampaigns: campaign.status === "ACTIVE" ? 1 : 0,
        pausedCampaigns: campaign.status === "PAUSED" ? 1 : 0,
      },
    };
  });

  const total = sumInsights([...campaignTotals.values()]);
  const activeSorted = summaries
    .filter((s) => s.campaign.status === "ACTIVE")
    .sort((a, b) => b.summary.spend - a.summary.spend);

  return {
    account,
    adAccounts,
    summary: {
      spend: total.spend,
      impressions: total.impressions,
      clicks: total.clicks,
      conversions: total.conversions,
      leads: total.leads,
      purchases: total.purchases,
      revenue: total.revenue,
      metrics: deriveMetrics(total),
      activeCampaigns: campaigns.filter((c) => c.status === "ACTIVE").length,
      pausedCampaigns: campaigns.filter((c) => c.status === "PAUSED").length,
    },
    dailySpend,
    topCampaigns: activeSorted.slice(0, 5),
    worstCampaigns: [...activeSorted].reverse().slice(0, 5),
    alerts,
    lastSyncAt: account.lastSyncAt,
  };
}
