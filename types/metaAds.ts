/** Meta Ads (Marketing API oficial) — Fase 29. Toda comunicação com a Graph
 * Marketing API passa por domain/metaAds/provider.ts::MetaAdsProvider —
 * nenhum tipo aqui conhece a forma exata do payload da API; os mapeamentos
 * ficam isolados em services/metaAds/metaMarketingProvider.ts. Não confundir
 * com o Meta Conversions API/Pixel (Fase 9, types/metaConversionsApi.ts) —
 * são integrações distintas, com providers e tabelas próprias. */

export type MetaAccountStatus = "conectado" | "desconectado" | "erro";

export interface MetaAccount {
  id: string;
  metaUserId: string;
  name: string | null;
  email: string | null;
  status: MetaAccountStatus;
  lastSyncAt: string | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MetaBusiness {
  id: string;
  accountId: string;
  metaBusinessId: string;
  name: string;
  verificationStatus: string | null;
  createdAt: string;
}

export interface MetaAdAccount {
  id: string;
  accountId: string;
  businessId: string | null;
  businessName: string | null;
  metaAdAccountId: string;
  name: string;
  currency: string;
  timezoneName: string | null;
  accountStatus: string | null;
  clientId: string | null;
  clientCompany: string | null;
  responsibleId: string | null;
  responsibleName: string | null;
  createdAt: string;
  updatedAt: string;
}

export type MetaCampaignStatus = "ACTIVE" | "PAUSED" | "ARCHIVED" | "DELETED";

export interface MetaCampaign {
  id: string;
  adAccountId: string;
  metaCampaignId: string;
  name: string;
  objective: string | null;
  status: MetaCampaignStatus;
  effectiveStatus: string | null;
  dailyBudget: number | null;
  lifetimeBudget: number | null;
  budgetRemaining: number | null;
  startTime: string | null;
  stopTime: string | null;
  crmProjectId: string | null;
  crmProjectName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MetaAdSet {
  id: string;
  campaignId: string;
  metaAdSetId: string;
  name: string;
  status: MetaCampaignStatus;
  effectiveStatus: string | null;
  dailyBudget: number | null;
  lifetimeBudget: number | null;
  optimizationGoal: string | null;
  billingEvent: string | null;
  targeting: Record<string, unknown>;
  startTime: string | null;
  endTime: string | null;
  createdAt: string;
  updatedAt: string;
}

export type MetaCreativeKind = "imagem" | "video" | "carrossel" | "texto";

export interface MetaCreative {
  id: string;
  adAccountId: string;
  metaCreativeId: string;
  name: string | null;
  kind: MetaCreativeKind;
  thumbnailUrl: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  headline: string | null;
  body: string | null;
  description: string | null;
  callToAction: string | null;
  status: string | null;
  createdAt: string;
}

export interface MetaAd {
  id: string;
  adSetId: string;
  creativeId: string | null;
  creative: MetaCreative | null;
  metaAdId: string;
  name: string;
  status: MetaCampaignStatus;
  effectiveStatus: string | null;
  createdAt: string;
  updatedAt: string;
}

export type MetaAudienceKind = "custom" | "lookalike" | "saved";

export interface MetaAudience {
  id: string;
  adAccountId: string;
  metaAudienceId: string;
  name: string;
  kind: MetaAudienceKind;
  approximateCount: number | null;
  status: string | null;
  origin: string | null;
  createdAt: string;
}

export type MetaInsightLevel = "account" | "campaign" | "ad_set" | "ad";

/** Números brutos da Meta — taxas derivadas (CTR/CPM/CPC/CPA/ROAS) são
 * calculadas em domain/metaAds/metrics.ts a partir destes campos, nunca
 * guardadas em duplicidade. */
export interface MetaInsightRaw {
  date: string;
  impressions: number;
  reach: number;
  frequency: number | null;
  clicks: number;
  spend: number;
  conversions: number;
  leads: number;
  purchases: number;
  revenue: number;
}

export interface MetaInsightRow extends MetaInsightRaw {
  id: string;
  adAccountId: string;
  campaignId: string | null;
  adSetId: string | null;
  adId: string | null;
  level: MetaInsightLevel;
}

/** Taxas derivadas de um MetaInsightRaw (ou de um agregado de vários) — ver
 * domain/metaAds/metrics.ts::deriveMetrics. Nunca persistido. */
export interface MetaDerivedMetrics {
  ctr: number | null;
  cpm: number | null;
  cpc: number | null;
  cpa: number | null;
  roas: number | null;
  roi: number | null;
}

export const META_CONVERSION_EVENT_NAMES = [
  "Purchase",
  "Lead",
  "CompleteRegistration",
  "AddToCart",
  "ViewContent",
  "PageView",
] as const;
export type MetaConversionEventName = (typeof META_CONVERSION_EVENT_NAMES)[number];

export interface MetaConversionEvent {
  id: string;
  adAccountId: string;
  campaignId: string | null;
  adId: string | null;
  date: string;
  eventName: MetaConversionEventName;
  eventCount: number;
  value: number;
  currency: string;
}

export type MetaSyncJobType =
  | "businesses"
  | "ad_accounts"
  | "campaigns"
  | "ad_sets"
  | "ads"
  | "creatives"
  | "audiences"
  | "insights"
  | "conversions"
  | "full";

export type MetaSyncJobStatus = "pendente" | "executando" | "concluido" | "falhou";
export type MetaSyncTriggerSource = "manual" | "automatico" | "webhook";

export interface MetaSyncJob {
  id: string;
  accountId: string;
  adAccountId: string | null;
  jobType: MetaSyncJobType;
  status: MetaSyncJobStatus;
  triggerSource: MetaSyncTriggerSource;
  attempts: number;
  maxAttempts: number;
  nextAttemptAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  error: string | null;
  stats: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export type MetaAdsAlertKind =
  | "campanha_pausada"
  | "campanha_sem_gasto"
  | "cpa_elevado"
  | "roas_baixo"
  | "anuncio_reprovado"
  | "conta_desconectada"
  | "token_expirando"
  | "falha_sincronizacao";

export interface MetaAdsAlert {
  kind: MetaAdsAlertKind;
  severity: "info" | "atencao" | "critico";
  title: string;
  description: string;
  entityId: string | null;
  entityName: string | null;
  href: string | null;
}

export interface MetaAdsFilters {
  adAccountId?: string;
  businessId?: string;
  campaignId?: string;
  adSetId?: string;
  period?: { from: string; to: string };
  objective?: string;
  status?: MetaCampaignStatus;
  responsibleId?: string;
  clientId?: string;
}

export interface MetaAdsSummary {
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  leads: number;
  purchases: number;
  revenue: number;
  metrics: MetaDerivedMetrics;
  activeCampaigns: number;
  pausedCampaigns: number;
}

export interface MetaAdsDailySpendPoint {
  date: string;
  spend: number;
  conversions: number;
}

export interface MetaAdsCampaignSummary {
  campaign: MetaCampaign;
  summary: MetaAdsSummary;
}

export interface MetaAdsDashboardData {
  account: MetaAccount | null;
  adAccounts: MetaAdAccount[];
  summary: MetaAdsSummary;
  dailySpend: MetaAdsDailySpendPoint[];
  topCampaigns: MetaAdsCampaignSummary[];
  worstCampaigns: MetaAdsCampaignSummary[];
  alerts: MetaAdsAlert[];
  lastSyncAt: string | null;
}

export interface MetaAdsCampaignsPageData {
  campaigns: MetaAdsCampaignSummary[];
  adAccounts: MetaAdAccount[];
}

export interface MetaAdsCreativesPageData {
  creatives: MetaCreative[];
  adAccounts: MetaAdAccount[];
}

export interface MetaAdsAudiencesPageData {
  audiences: MetaAudience[];
  adAccounts: MetaAdAccount[];
}

export interface MetaAdsSettingsPageData {
  account: MetaAccount | null;
  businesses: MetaBusiness[];
  adAccounts: MetaAdAccount[];
  recentJobs: MetaSyncJob[];
  oauthConfigured: boolean;
}
