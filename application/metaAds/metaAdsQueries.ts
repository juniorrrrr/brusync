import "server-only";

import { requireCrmProfile } from "@/application/crm/authGuard";
import { getOwnerOptions } from "@/application/crm/leadsQueries";
import { deriveMetrics } from "@/domain/metaAds/metrics";
import {
  getDemoMetaAdsAudiencesPageData,
  getDemoMetaAdsCampaignsPageData,
  getDemoMetaAdsCreativesPageData,
} from "@/lib/demo/mockMetaAds";
import { getActiveMetaAccount } from "@/repositories/metaAds/accountsRepository";
import { listAdAccounts } from "@/repositories/metaAds/adAccountsRepository";
import { listAudiences } from "@/repositories/metaAds/audiencesRepository";
import { listCampaigns } from "@/repositories/metaAds/campaignsRepository";
import { listCreatives } from "@/repositories/metaAds/creativesRepository";
import { listCampaignInsightTotals } from "@/repositories/metaAds/insightsRepository";
import { isDemoModeActive } from "@/services/demo/demoMode";
import {
  getMetaAdsAccount,
  getMetaAdsSettingsPageData,
} from "@/services/metaAds/metaAdsAccountService";
import {
  listClientOptionsForLink,
  listProjectOptionsForLink,
} from "@/services/metaAds/metaAdsCrmLinkService";
import { getMetaAdsDashboardData } from "@/services/metaAds/metaAdsDashboardService";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type {
  MetaAccount,
  MetaAdsAudiencesPageData,
  MetaAdsCampaignSummary,
  MetaAdsCampaignsPageData,
  MetaAdsCreativesPageData,
  MetaAdsDashboardData,
  MetaAdsSettingsPageData,
} from "@/types/metaAds";

/** Wrappers finos, um por tela do módulo — mesmo padrão de
 * application/whatsapp/whatsappQueries.ts: guard de sessão + delega para
 * services/metaAds/*, que já é 100% ciente de Modo Demonstração. */

export async function fetchMetaAdsAccount(): Promise<MetaAccount | null> {
  await requireCrmProfile();
  return getMetaAdsAccount();
}

export async function fetchMetaAdsDashboardData(
  adAccountId?: string,
): Promise<MetaAdsDashboardData> {
  await requireCrmProfile();
  return getMetaAdsDashboardData({ adAccountId });
}

export async function fetchMetaAdsCampaignsPageData(): Promise<MetaAdsCampaignsPageData> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return getDemoMetaAdsCampaignsPageData();

  const supabase = await getSupabaseAuthClient();
  const account = await getActiveMetaAccount(supabase);
  if (!account) return { campaigns: [], adAccounts: [] };

  const adAccounts = await listAdAccounts(supabase, account.id);
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const until = new Date().toISOString().slice(0, 10);

  const campaigns: MetaAdsCampaignSummary[] = [];
  for (const adAccount of adAccounts) {
    const [rows, totals] = await Promise.all([
      listCampaigns(supabase, { adAccountId: adAccount.id }),
      listCampaignInsightTotals(supabase, adAccount.id, since, until),
    ]);
    for (const campaign of rows) {
      const raw = totals.get(campaign.id) ?? {
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
      campaigns.push({
        campaign,
        summary: {
          ...raw,
          metrics: deriveMetrics(raw),
          activeCampaigns: campaign.status === "ACTIVE" ? 1 : 0,
          pausedCampaigns: campaign.status === "PAUSED" ? 1 : 0,
        },
      });
    }
  }

  return { campaigns, adAccounts };
}

export async function fetchMetaAdsCreativesPageData(): Promise<MetaAdsCreativesPageData> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return getDemoMetaAdsCreativesPageData();

  const supabase = await getSupabaseAuthClient();
  const account = await getActiveMetaAccount(supabase);
  if (!account) return { creatives: [], adAccounts: [] };

  const adAccounts = await listAdAccounts(supabase, account.id);
  const creatives = await listCreatives(supabase);
  return { creatives, adAccounts };
}

export async function fetchMetaAdsAudiencesPageData(): Promise<MetaAdsAudiencesPageData> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return getDemoMetaAdsAudiencesPageData();

  const supabase = await getSupabaseAuthClient();
  const account = await getActiveMetaAccount(supabase);
  if (!account) return { audiences: [], adAccounts: [] };

  const adAccounts = await listAdAccounts(supabase, account.id);
  const audiences = await listAudiences(supabase);
  return { audiences, adAccounts };
}

export async function fetchMetaAdsSettingsPageData(): Promise<MetaAdsSettingsPageData> {
  await requireCrmProfile();
  return getMetaAdsSettingsPageData();
}

export async function fetchMetaAdsClientOptions(): Promise<{ id: string; company: string }[]> {
  await requireCrmProfile();
  return listClientOptionsForLink();
}

export async function fetchMetaAdsProjectOptions(): Promise<{ id: string; name: string }[]> {
  await requireCrmProfile();
  return listProjectOptionsForLink();
}

/** Reaproveita application/crm/leadsQueries.ts::getOwnerOptions — mesma
 * lista de responsáveis já usada em Leads/WhatsApp, nenhuma consulta nova
 * de "profiles" é criada para o Meta Ads. */
export async function fetchMetaAdsResponsibleOptions(): Promise<
  { id: string; name: string | null; email: string | null }[]
> {
  await requireCrmProfile();
  return getOwnerOptions();
}
