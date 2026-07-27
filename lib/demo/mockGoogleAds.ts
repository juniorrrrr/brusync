import type {
  GoogleAdsAccount,
  GoogleAdsCampaign,
  GoogleAdsCampaignSummary,
  GoogleAdsDashboardData,
  GoogleAdsInsightDaily,
} from "@/types/googleAds";

/** Dataset fictício para o Modo Demonstração — nunca gravado no Supabase,
 * nunca chama a Google Ads API. Mesmo espírito de lib/demo/mockMetaAds.ts:
 * série diária determinística (sem Math.random). */

const now = new Date();
function daysAgoIso(days: number): string {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
}
function dateOnly(days: number): string {
  return daysAgoIso(days).slice(0, 10);
}

export const DEMO_GOOGLE_ADS_ACCOUNT: GoogleAdsAccount = {
  id: "00000000-ga00-4000-8000-000000000001",
  customerId: "1234567890",
  descriptiveName: "Brusync — Conta Google Ads",
  currencyCode: "BRL",
  timeZone: "America/Sao_Paulo",
  isManager: false,
  isSynced: true,
  status: "conectado",
  lastSyncAt: daysAgoIso(0),
  error: null,
  clientId: null,
  responsibleId: null,
  createdAt: daysAgoIso(60),
  updatedAt: daysAgoIso(0),
};

interface CampaignSeed {
  name: string;
  channelType: string;
  status: GoogleAdsCampaign["status"];
  budgetAmount: number;
  baseSpendPerDay: number;
  ctrPct: number;
  convRate: number;
}

const CAMPAIGN_SEEDS: CampaignSeed[] = [
  {
    name: "Pesquisa — Marca",
    channelType: "SEARCH",
    status: "ENABLED",
    budgetAmount: 120,
    baseSpendPerDay: 105,
    ctrPct: 6.2,
    convRate: 0.08,
  },
  {
    name: "Pesquisa — Genérico",
    channelType: "SEARCH",
    status: "ENABLED",
    budgetAmount: 200,
    baseSpendPerDay: 178,
    ctrPct: 3.1,
    convRate: 0.03,
  },
  {
    name: "Performance Max — Conversões",
    channelType: "PERFORMANCE_MAX",
    status: "ENABLED",
    budgetAmount: 150,
    baseSpendPerDay: 140,
    ctrPct: 1.4,
    convRate: 0.045,
  },
  {
    name: "Display — Remarketing",
    channelType: "DISPLAY",
    status: "PAUSED",
    budgetAmount: 40,
    baseSpendPerDay: 0,
    ctrPct: 0.6,
    convRate: 0.01,
  },
];

export const DEMO_GOOGLE_ADS_CAMPAIGNS: (GoogleAdsCampaign & { seed: CampaignSeed })[] =
  CAMPAIGN_SEEDS.map((seed, index) => ({
    id: `00000000-ga00-4000-8000-00000000${String(10 + index).padStart(4, "0")}`,
    accountId: DEMO_GOOGLE_ADS_ACCOUNT.id,
    campaignId: `${9000 + index}`,
    name: seed.name,
    channelType: seed.channelType,
    status: seed.status,
    budgetAmount: seed.budgetAmount,
    crmProjectId: null,
    crmProjectName: null,
    createdAt: daysAgoIso(50),
    updatedAt: daysAgoIso(0),
    seed,
  }));

const INSIGHT_DAYS = 30;

function buildDailyInsights(): GoogleAdsInsightDaily[] {
  const rows: GoogleAdsInsightDaily[] = [];
  for (let dayOffset = INSIGHT_DAYS - 1; dayOffset >= 0; dayOffset -= 1) {
    let impressions = 0;
    let clicks = 0;
    let cost = 0;
    let conversions = 0;
    let conversionsValue = 0;

    for (const campaign of DEMO_GOOGLE_ADS_CAMPAIGNS) {
      const wave = 1 + 0.15 * Math.sin((dayOffset + campaign.name.length) / 2.5);
      const spend = Math.round(campaign.seed.baseSpendPerDay * wave * 100) / 100;
      const imp = Math.round((spend / 18) * 1000);
      const clk = Math.round((imp * campaign.seed.ctrPct) / 100);
      const conv = Math.round(clk * campaign.seed.convRate * 10) / 10;

      impressions += imp;
      clicks += clk;
      cost += spend;
      conversions += conv;
      conversionsValue += conv * 380;
    }

    rows.push({
      date: dateOnly(dayOffset),
      impressions,
      clicks,
      cost: Math.round(cost * 100) / 100,
      conversions: Math.round(conversions * 10) / 10,
      conversionsValue: Math.round(conversionsValue * 100) / 100,
      ctr: impressions > 0 ? Math.round((clicks / impressions) * 10000) / 100 : null,
      cpm: impressions > 0 ? Math.round((cost / impressions) * 1000 * 100) / 100 : null,
      cpa: conversions > 0 ? Math.round((cost / conversions) * 100) / 100 : null,
      roas: cost > 0 ? Math.round((conversionsValue / cost) * 100) / 100 : null,
      roi: cost > 0 ? Math.round(((conversionsValue - cost) / cost) * 10000) / 100 : null,
    });
  }
  return rows;
}

const DAILY_INSIGHTS = buildDailyInsights();

export function getDemoGoogleAdsAccount(): GoogleAdsAccount {
  return DEMO_GOOGLE_ADS_ACCOUNT;
}

export function getDemoGoogleAdsDashboardData(): GoogleAdsDashboardData {
  const totals = DAILY_INSIGHTS.reduce(
    (acc, row) => ({
      spend: acc.spend + row.cost,
      clicks: acc.clicks + row.clicks,
      impressions: acc.impressions + row.impressions,
      conversions: acc.conversions + row.conversions,
      conversionsValue: acc.conversionsValue + row.conversionsValue,
    }),
    { spend: 0, clicks: 0, impressions: 0, conversions: 0, conversionsValue: 0 },
  );

  const topCampaigns: GoogleAdsCampaignSummary[] = [...DEMO_GOOGLE_ADS_CAMPAIGNS]
    .filter((c) => c.status === "ENABLED")
    .map((campaign) => ({
      campaign,
      spend: campaign.seed.baseSpendPerDay * INSIGHT_DAYS,
      clicks: Math.round(
        (campaign.seed.baseSpendPerDay * INSIGHT_DAYS * campaign.seed.ctrPct) / 18,
      ),
      conversions: Math.round(
        campaign.seed.baseSpendPerDay * INSIGHT_DAYS * campaign.seed.convRate,
      ),
    }))
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 3);

  return {
    account: DEMO_GOOGLE_ADS_ACCOUNT,
    summary: {
      spend: Math.round(totals.spend * 100) / 100,
      clicks: totals.clicks,
      impressions: totals.impressions,
      conversions: Math.round(totals.conversions * 10) / 10,
      conversionsValue: Math.round(totals.conversionsValue * 100) / 100,
      ctr:
        totals.impressions > 0
          ? Math.round((totals.clicks / totals.impressions) * 10000) / 100
          : null,
      cpm:
        totals.impressions > 0
          ? Math.round((totals.spend / totals.impressions) * 1000 * 100) / 100
          : null,
      cpa:
        totals.conversions > 0 ? Math.round((totals.spend / totals.conversions) * 100) / 100 : null,
      roas:
        totals.spend > 0 ? Math.round((totals.conversionsValue / totals.spend) * 100) / 100 : null,
      roi:
        totals.spend > 0
          ? Math.round(((totals.conversionsValue - totals.spend) / totals.spend) * 10000) / 100
          : null,
      activeCampaigns: DEMO_GOOGLE_ADS_CAMPAIGNS.filter((c) => c.status === "ENABLED").length,
    },
    dailySpend: DAILY_INSIGHTS.map((row) => ({
      date: row.date,
      cost: row.cost,
      conversions: row.conversions,
    })),
    topCampaigns,
    lastSyncAt: DEMO_GOOGLE_ADS_ACCOUNT.lastSyncAt,
  };
}
