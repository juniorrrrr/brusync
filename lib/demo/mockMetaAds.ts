import { computeMetaAdsAlerts } from "@/domain/metaAds/alerts";
import { deriveMetrics, sumInsights } from "@/domain/metaAds/metrics";
import { DEMO_OWNERS, DEMO_STANDALONE_CLIENTS } from "@/lib/demo/mockSeed";
import type {
  MetaAccount,
  MetaAdAccount,
  MetaAdsAudiencesPageData,
  MetaAdsCampaignSummary,
  MetaAdsCampaignsPageData,
  MetaAdsCreativesPageData,
  MetaAdsDashboardData,
  MetaAdsSettingsPageData,
  MetaAudience,
  MetaCampaign,
  MetaCreative,
  MetaInsightRaw,
  MetaSyncJob,
} from "@/types/metaAds";

/** Dataset fictício para o Modo Demonstração — nunca gravado no Supabase,
 * nunca chama a Graph API. Contas de anúncios reaproveitam os mesmos
 * DEMO_STANDALONE_CLIENTS/DEMO_OWNERS já usados em CRM/WhatsApp
 * (mockSeed.ts) para os números baterem com o resto do sistema em Modo
 * Demonstração — nenhum indicador é recalculado com uma fórmula própria:
 * as taxas usam a mesma domain/metaAds/metrics.ts que os dados reais. */

let seq = 0;
function demoId(prefix: string): string {
  seq += 1;
  return `00000000-ma00-4000-8000-${prefix}${String(seq).padStart(9, "0")}`;
}

const now = new Date();
function daysAgoIso(days: number): string {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
}
function dateOnly(days: number): string {
  return daysAgoIso(days).slice(0, 10);
}

export const DEMO_META_ACCOUNT: MetaAccount = {
  id: demoId("acc"),
  metaUserId: "10159876543210",
  name: "Brusync Marketing",
  email: "marketing@brusync.com.br",
  status: "conectado",
  lastSyncAt: daysAgoIso(0),
  error: null,
  createdAt: daysAgoIso(60),
  updatedAt: daysAgoIso(0),
};

const BUSINESS_SEEDS = [
  { id: demoId("biz"), metaBusinessId: "biz_1000001", name: "Brusync Business Manager" },
];

const AD_ACCOUNT_SEEDS: {
  id: string;
  metaAdAccountId: string;
  name: string;
  currency: string;
  clientIndex: number;
  ownerIndex: number;
}[] = [
  {
    id: demoId("adacc"),
    metaAdAccountId: "act_1000000001",
    name: "Grupo Litoral Hotéis — Ads",
    currency: "BRL",
    clientIndex: 0,
    ownerIndex: 0,
  },
  {
    id: demoId("adacc"),
    metaAdAccountId: "act_1000000002",
    name: "Bella Vita Restaurantes — Ads",
    currency: "BRL",
    clientIndex: 1,
    ownerIndex: 1,
  },
];

export const DEMO_META_AD_ACCOUNTS: MetaAdAccount[] = AD_ACCOUNT_SEEDS.map((seed) => {
  const client = DEMO_STANDALONE_CLIENTS[seed.clientIndex];
  const owner = DEMO_OWNERS[seed.ownerIndex];
  return {
    id: seed.id,
    accountId: DEMO_META_ACCOUNT.id,
    businessId: BUSINESS_SEEDS[0].id,
    businessName: BUSINESS_SEEDS[0].name,
    metaAdAccountId: seed.metaAdAccountId,
    name: seed.name,
    currency: seed.currency,
    timezoneName: "America/Sao_Paulo",
    accountStatus: "1",
    clientId: client.id,
    clientCompany: client.company,
    responsibleId: owner.id,
    responsibleName: owner.name,
    createdAt: daysAgoIso(55),
    updatedAt: daysAgoIso(0),
  };
});

interface CampaignSeed {
  adAccountIndex: number;
  name: string;
  objective: string;
  status: MetaCampaign["status"];
  dailyBudget: number;
  baseSpendPerDay: number;
  ctrPct: number;
  convRate: number;
  avgTicket: number;
}

const CAMPAIGN_SEEDS: CampaignSeed[] = [
  {
    adAccountIndex: 0,
    name: "Reservas — Alta Temporada",
    objective: "OUTCOME_SALES",
    status: "ACTIVE",
    dailyBudget: 250,
    baseSpendPerDay: 230,
    ctrPct: 1.8,
    convRate: 0.032,
    avgTicket: 480,
  },
  {
    adAccountIndex: 0,
    name: "Remarketing — Visitantes do site",
    objective: "OUTCOME_TRAFFIC",
    status: "ACTIVE",
    dailyBudget: 80,
    baseSpendPerDay: 76,
    ctrPct: 2.4,
    convRate: 0.012,
    avgTicket: 480,
  },
  {
    adAccountIndex: 0,
    name: "Institucional — Marca",
    objective: "OUTCOME_AWARENESS",
    status: "PAUSED",
    dailyBudget: 60,
    baseSpendPerDay: 0,
    ctrPct: 0.9,
    convRate: 0.004,
    avgTicket: 480,
  },
  {
    adAccountIndex: 1,
    name: "Delivery — Geração de Leads",
    objective: "OUTCOME_LEADS",
    status: "ACTIVE",
    dailyBudget: 150,
    baseSpendPerDay: 142,
    ctrPct: 2.1,
    convRate: 0.045,
    avgTicket: 95,
  },
  {
    adAccountIndex: 1,
    name: "Promoção de Fim de Semana",
    objective: "OUTCOME_ENGAGEMENT",
    status: "ACTIVE",
    dailyBudget: 40,
    baseSpendPerDay: 3,
    ctrPct: 0.7,
    convRate: 0.006,
    avgTicket: 95,
  },
];

export const DEMO_META_CAMPAIGNS: (MetaCampaign & { seed: CampaignSeed })[] = CAMPAIGN_SEEDS.map(
  (seed, index) => ({
    id: demoId("camp"),
    adAccountId: DEMO_META_AD_ACCOUNTS[seed.adAccountIndex].id,
    metaCampaignId: `camp_${1000 + index}`,
    name: seed.name,
    objective: seed.objective,
    status: seed.status,
    effectiveStatus: seed.status,
    dailyBudget: seed.dailyBudget,
    lifetimeBudget: null,
    budgetRemaining: seed.status === "ACTIVE" ? seed.dailyBudget * 12 : seed.dailyBudget * 30,
    startTime: daysAgoIso(45),
    stopTime: null,
    crmProjectId: null,
    crmProjectName: null,
    createdAt: daysAgoIso(45),
    updatedAt: daysAgoIso(0),
    seed,
  }),
);

const CREATIVE_KIND_BY_CAMPAIGN: MetaCreative["kind"][] = [
  "imagem",
  "video",
  "imagem",
  "carrossel",
  "imagem",
];

export const DEMO_META_CREATIVES: MetaCreative[] = DEMO_META_CAMPAIGNS.map((campaign, index) => ({
  id: demoId("creative"),
  adAccountId: campaign.adAccountId,
  metaCreativeId: `creative_${1000 + index}`,
  name: `Criativo — ${campaign.name}`,
  kind: CREATIVE_KIND_BY_CAMPAIGN[index % CREATIVE_KIND_BY_CAMPAIGN.length],
  thumbnailUrl: null,
  imageUrl: null,
  videoUrl: null,
  headline: campaign.name,
  body: "Confira nossa oferta especial — condições exclusivas por tempo limitado.",
  description: null,
  callToAction: index % 2 === 0 ? "SAIBA_MAIS" : "COMPRAR_AGORA",
  status: index === 4 ? "DISAPPROVED" : "ACTIVE",
  createdAt: daysAgoIso(40),
}));

const DEMO_ADS = DEMO_META_CAMPAIGNS.map((campaign, index) => ({
  id: demoId("ad"),
  adSetId: demoId("adset"),
  creativeId: DEMO_META_CREATIVES[index].id,
  creative: DEMO_META_CREATIVES[index],
  metaAdId: `ad_${1000 + index}`,
  name: `Anúncio — ${campaign.name}`,
  status: campaign.status,
  effectiveStatus:
    DEMO_META_CREATIVES[index].status === "DISAPPROVED" ? "DISAPPROVED" : campaign.status,
  createdAt: daysAgoIso(40),
  updatedAt: daysAgoIso(0),
  campaignName: campaign.name,
}));

const AUDIENCE_SEEDS: {
  adAccountIndex: number;
  name: string;
  kind: MetaAudience["kind"];
  count: number;
}[] = [
  { adAccountIndex: 0, name: "Visitantes do site — 30 dias", kind: "custom", count: 18400 },
  { adAccountIndex: 0, name: "Lookalike 1% — Compradores", kind: "lookalike", count: 62000 },
  { adAccountIndex: 0, name: "Hóspedes recorrentes", kind: "saved", count: 9200 },
  { adAccountIndex: 1, name: "Base de clientes — CRM", kind: "custom", count: 5300 },
  { adAccountIndex: 1, name: "Lookalike 2% — Delivery", kind: "lookalike", count: 41000 },
];

export const DEMO_META_AUDIENCES: MetaAudience[] = AUDIENCE_SEEDS.map((seed) => ({
  id: demoId("aud"),
  adAccountId: DEMO_META_AD_ACCOUNTS[seed.adAccountIndex].id,
  metaAudienceId: `aud_${seed.name.replace(/\s+/g, "_")}`,
  name: seed.name,
  kind: seed.kind,
  approximateCount: seed.count,
  status: "ready",
  origin:
    seed.kind === "custom" ? "Website" : seed.kind === "lookalike" ? "Compradores 180 dias" : "CRM",
  createdAt: daysAgoIso(30),
}));

const INSIGHT_DAYS = 30;

/** Série diária determinística (sem Math.random — mesmo padrão de
 * lib/demo/mockAnalytics.ts) por campanha, com uma leve variação senoidal
 * para o dashboard não parecer uma linha reta. */
const ASSUMED_CPM = 45; // R$ por 1.000 impressões — só para gerar um dataset coerente, nunca usado fora do modo demonstração

function buildDailyInsights(seed: CampaignSeed, campaignIndex: number): MetaInsightRaw[] {
  const rows: MetaInsightRaw[] = [];
  for (let dayOffset = INSIGHT_DAYS - 1; dayOffset >= 0; dayOffset -= 1) {
    const wave = 1 + 0.18 * Math.sin((dayOffset + campaignIndex) / 2.7);
    const spend = Math.round(seed.baseSpendPerDay * wave * 100) / 100;
    const impressions = Math.round((spend / ASSUMED_CPM) * 1000);
    const clicks = Math.round((impressions * seed.ctrPct) / 100);
    const conversions = Math.round(clicks * seed.convRate) || (spend > 0 ? 1 : 0);
    const leads = seed.objective === "OUTCOME_LEADS" ? conversions : Math.round(conversions * 0.3);
    const purchases =
      seed.objective === "OUTCOME_SALES" ? conversions : Math.round(conversions * 0.2);
    const revenue = Math.round(purchases * seed.avgTicket * 100) / 100;

    rows.push({
      date: dateOnly(dayOffset),
      impressions,
      reach: Math.round(impressions * 0.72),
      frequency: impressions > 0 ? 1.3 : null,
      clicks,
      spend,
      conversions,
      leads,
      purchases,
      revenue,
    });
  }
  return rows;
}

const CAMPAIGN_INSIGHTS: Map<string, MetaInsightRaw[]> = new Map(
  DEMO_META_CAMPAIGNS.map((campaign, index) => [
    campaign.id,
    buildDailyInsights(campaign.seed, index),
  ]),
);

function last7Days(rows: MetaInsightRaw[]): MetaInsightRaw {
  return sumInsights(rows.slice(-7));
}

function campaignSummary(campaign: MetaCampaign): MetaAdsCampaignSummary {
  const rows = CAMPAIGN_INSIGHTS.get(campaign.id) ?? [];
  const total = sumInsights(rows);
  const metrics = deriveMetrics(total);
  return {
    campaign,
    summary: {
      spend: total.spend,
      impressions: total.impressions,
      clicks: total.clicks,
      conversions: total.conversions,
      leads: total.leads,
      purchases: total.purchases,
      revenue: total.revenue,
      metrics,
      activeCampaigns: campaign.status === "ACTIVE" ? 1 : 0,
      pausedCampaigns: campaign.status === "PAUSED" ? 1 : 0,
    },
  };
}

const DEMO_SYNC_JOBS: MetaSyncJob[] = [
  {
    id: demoId("job"),
    accountId: DEMO_META_ACCOUNT.id,
    adAccountId: null,
    jobType: "insights",
    status: "concluido",
    triggerSource: "automatico",
    attempts: 1,
    maxAttempts: 5,
    nextAttemptAt: daysAgoIso(0),
    startedAt: daysAgoIso(0),
    finishedAt: daysAgoIso(0),
    error: null,
    stats: { adAccounts: 2, insightRows: 240 },
    createdAt: daysAgoIso(0),
    updatedAt: daysAgoIso(0),
  },
  {
    id: demoId("job"),
    accountId: DEMO_META_ACCOUNT.id,
    adAccountId: DEMO_META_AD_ACCOUNTS[1].id,
    jobType: "creatives",
    status: "falhou",
    triggerSource: "automatico",
    attempts: 2,
    maxAttempts: 5,
    nextAttemptAt: daysAgoIso(-1),
    startedAt: daysAgoIso(1),
    finishedAt: daysAgoIso(1),
    error: "Timeout ao consultar criativos — tentativa automática em breve.",
    stats: {},
    createdAt: daysAgoIso(1),
    updatedAt: daysAgoIso(1),
  },
];

export function getDemoMetaAdsAccount(): MetaAccount {
  return DEMO_META_ACCOUNT;
}

export function getDemoMetaAdsDashboardData(): MetaAdsDashboardData {
  const summaries = DEMO_META_CAMPAIGNS.map(campaignSummary);
  const allRows = [...CAMPAIGN_INSIGHTS.values()].flat();
  const total = sumInsights(allRows);
  const metrics = deriveMetrics(total);

  const dailySpendMap = new Map<string, { spend: number; conversions: number }>();
  for (const rows of CAMPAIGN_INSIGHTS.values()) {
    for (const row of rows) {
      const acc = dailySpendMap.get(row.date) ?? { spend: 0, conversions: 0 };
      dailySpendMap.set(row.date, {
        spend: acc.spend + row.spend,
        conversions: acc.conversions + row.conversions,
      });
    }
  }
  const dailySpend = [...dailySpendMap.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, v]) => ({ date, spend: v.spend, conversions: v.conversions }));

  const sorted = [...summaries].sort((a, b) => b.summary.spend - a.summary.spend);
  const activeSorted = sorted.filter((s) => s.campaign.status === "ACTIVE");

  const alerts = computeMetaAdsAlerts({
    account: DEMO_META_ACCOUNT,
    campaigns: DEMO_META_CAMPAIGNS.map((campaign) => ({
      campaign,
      last7Days: last7Days(CAMPAIGN_INSIGHTS.get(campaign.id) ?? []),
    })),
    failedAds: DEMO_ADS.filter((ad) => ad.effectiveStatus === "DISAPPROVED").map((ad) => ({
      id: ad.id,
      name: ad.name,
      campaignName: ad.campaignName,
    })),
    recentFailedJobs: DEMO_SYNC_JOBS.filter((j) => j.status === "falhou"),
    tokenExpiresAt: daysAgoIso(-45),
  });

  return {
    account: DEMO_META_ACCOUNT,
    adAccounts: DEMO_META_AD_ACCOUNTS,
    summary: {
      spend: total.spend,
      impressions: total.impressions,
      clicks: total.clicks,
      conversions: total.conversions,
      leads: total.leads,
      purchases: total.purchases,
      revenue: total.revenue,
      metrics,
      activeCampaigns: DEMO_META_CAMPAIGNS.filter((c) => c.status === "ACTIVE").length,
      pausedCampaigns: DEMO_META_CAMPAIGNS.filter((c) => c.status === "PAUSED").length,
    },
    dailySpend,
    topCampaigns: activeSorted.slice(0, 3),
    worstCampaigns: [...activeSorted].reverse().slice(0, 3),
    alerts,
    lastSyncAt: DEMO_META_ACCOUNT.lastSyncAt,
  };
}

export function getDemoMetaAdsCampaignsPageData(): MetaAdsCampaignsPageData {
  return {
    campaigns: DEMO_META_CAMPAIGNS.map(campaignSummary),
    adAccounts: DEMO_META_AD_ACCOUNTS,
  };
}

export function getDemoMetaAdsCreativesPageData(): MetaAdsCreativesPageData {
  return { creatives: DEMO_META_CREATIVES, adAccounts: DEMO_META_AD_ACCOUNTS };
}

export function getDemoMetaAdsAudiencesPageData(): MetaAdsAudiencesPageData {
  return { audiences: DEMO_META_AUDIENCES, adAccounts: DEMO_META_AD_ACCOUNTS };
}

export function getDemoMetaAdsSettingsPageData(): MetaAdsSettingsPageData {
  return {
    account: DEMO_META_ACCOUNT,
    businesses: BUSINESS_SEEDS.map((b) => ({
      id: b.id,
      accountId: DEMO_META_ACCOUNT.id,
      metaBusinessId: b.metaBusinessId,
      name: b.name,
      verificationStatus: "verified",
      createdAt: daysAgoIso(60),
    })),
    adAccounts: DEMO_META_AD_ACCOUNTS,
    recentJobs: DEMO_SYNC_JOBS,
    oauthConfigured: true,
  };
}
