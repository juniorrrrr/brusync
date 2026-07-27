import "server-only";

import { requireCrmProfile } from "@/application/crm/authGuard";
import { getDemoGoogleAdsDashboardData } from "@/lib/demo/mockGoogleAds";
import { listGoogleAdsCampaigns } from "@/repositories/googleAds/campaignsRepository";
import {
  listAccountDailyInsights,
  summarizeGoogleAdsInsights,
} from "@/repositories/googleAds/insightsRepository";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { getGoogleAdsAccount } from "@/services/googleAds/googleAdsAccountService";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type { GoogleAdsCampaignSummary, GoogleAdsDashboardData } from "@/types/googleAds";

const DASHBOARD_WINDOW_DAYS = 30;

/** Único ponto de leitura consolidada do Google Ads — mesmo papel de
 * application/metaAds/metaAdsQueries.ts::fetchMetaAdsDashboardData. Todo
 * módulo (Marketing Intelligence, Analytics, IA) que quiser dados do Google
 * Ads chama esta função, nunca uma query própria. */
export async function fetchGoogleAdsDashboardData(): Promise<GoogleAdsDashboardData> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return getDemoGoogleAdsDashboardData();

  const account = await getGoogleAdsAccount();
  if (!account) {
    return {
      account: null,
      summary: {
        spend: 0,
        clicks: 0,
        impressions: 0,
        conversions: 0,
        conversionsValue: 0,
        ctr: null,
        cpm: null,
        cpa: null,
        roas: null,
        roi: null,
        activeCampaigns: 0,
      },
      dailySpend: [],
      topCampaigns: [],
      lastSyncAt: null,
    };
  }

  const supabase = await getSupabaseAuthClient();
  const since = new Date(Date.now() - DASHBOARD_WINDOW_DAYS * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const [dailyInsights, campaigns] = await Promise.all([
    listAccountDailyInsights(supabase, account.id, since),
    listGoogleAdsCampaigns(supabase, account.id),
  ]);

  const activeCampaigns = campaigns.filter((c) => c.status === "ENABLED");
  const summary = summarizeGoogleAdsInsights(dailyInsights, activeCampaigns.length);

  // Modelo consolidado: métricas diárias são só no nível da conta (sem
  // campaign_id), não por campanha — "Top campanhas" aqui é uma lista das
  // campanhas ativas, sem quebra de gasto por campanha (isso exigiria a
  // granularidade completa que a Fase 35 deliberadamente não construiu).
  const topCampaigns: GoogleAdsCampaignSummary[] = activeCampaigns.slice(0, 5).map((campaign) => ({
    campaign,
    spend: 0,
    clicks: 0,
    conversions: 0,
  }));

  return {
    account,
    summary,
    dailySpend: dailyInsights.map((row) => ({
      date: row.date,
      cost: row.cost,
      conversions: row.conversions,
    })),
    topCampaigns,
    lastSyncAt: account.lastSyncAt,
  };
}
