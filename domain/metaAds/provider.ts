/** Camada de abstração exigida pela Fase 29 — nenhuma camada da aplicação
 * conhece a Graph Marketing API diretamente; tudo passa por esta interface.
 * A troca/adição de provider (ex.: um futuro sandbox provider para testes)
 * é só uma nova classe implementando `MetaAdsProvider` + um novo `case` em
 * services/metaAds/metaAdsProviderFactory.ts — nenhum outro arquivo muda.
 * Mesmo padrão de domain/whatsapp/provider.ts (Fase 28). */

export interface MetaAdsOAuthCredentials {
  /** Access Token de longa duração (já trocado a partir do short-lived
   * recebido no callback) ou de system user. */
  accessToken: string;
}

export interface ExchangeCodeInput {
  code: string;
  redirectUri: string;
}

export interface ExchangeCodeResult {
  accessToken: string;
  tokenType: "short_lived" | "long_lived";
  expiresInSeconds: number | null;
}

export interface RemoteMetaUser {
  metaUserId: string;
  name: string | null;
  email: string | null;
}

export interface RemoteBusiness {
  metaBusinessId: string;
  name: string;
  verificationStatus: string | null;
}

export interface RemoteAdAccount {
  metaAdAccountId: string;
  name: string;
  currency: string;
  timezoneName: string | null;
  accountStatus: string | null;
  businessId: string | null;
}

export interface RemoteCampaign {
  metaCampaignId: string;
  name: string;
  objective: string | null;
  status: string;
  effectiveStatus: string | null;
  dailyBudget: number | null;
  lifetimeBudget: number | null;
  budgetRemaining: number | null;
  startTime: string | null;
  stopTime: string | null;
}

export interface RemoteAdSet {
  metaAdSetId: string;
  metaCampaignId: string;
  name: string;
  status: string;
  effectiveStatus: string | null;
  dailyBudget: number | null;
  lifetimeBudget: number | null;
  optimizationGoal: string | null;
  billingEvent: string | null;
  targeting: Record<string, unknown>;
  startTime: string | null;
  endTime: string | null;
}

export interface RemoteAd {
  metaAdId: string;
  metaAdSetId: string;
  metaCreativeId: string | null;
  name: string;
  status: string;
  effectiveStatus: string | null;
}

export interface RemoteCreative {
  metaCreativeId: string;
  name: string | null;
  kind: "imagem" | "video" | "carrossel" | "texto";
  thumbnailUrl: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  headline: string | null;
  body: string | null;
  description: string | null;
  callToAction: string | null;
  status: string | null;
}

export interface RemoteAudience {
  metaAudienceId: string;
  name: string;
  kind: "custom" | "lookalike" | "saved";
  approximateCount: number | null;
  status: string | null;
  origin: string | null;
}

export interface RemoteInsightRow {
  level: "account" | "campaign" | "ad_set" | "ad";
  /** Presentes conforme o nível pedido — level='campaign' preenche apenas
   * campaignMetaId, level='ad' preenche os três (a Graph API sempre devolve
   * a cadeia completa de ids pai nas linhas de nível "ad"). */
  campaignMetaId: string | null;
  adSetMetaId: string | null;
  adMetaId: string | null;
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

export interface RemoteConversionEventRow {
  campaignMetaId: string | null;
  adMetaId: string | null;
  date: string;
  eventName:
    | "Purchase"
    | "Lead"
    | "CompleteRegistration"
    | "AddToCart"
    | "ViewContent"
    | "PageView";
  eventCount: number;
  value: number;
  currency: string;
}

export interface FetchInsightsInput {
  level: "account" | "campaign" | "ad_set" | "ad";
  since: string;
  until: string;
}

export interface ValidateTokenResult {
  ok: boolean;
  metaUserId?: string;
  name?: string;
  email?: string;
  error?: string;
}

/** Toda implementação (MetaMarketingProvider hoje; um provider de sandbox/
 * mock no futuro para testes de integração) recebe as credenciais já
 * resolvidas (descriptografadas) por quem a instancia — nunca lê variável de
 * ambiente ou tabela por conta própria, exceto App ID/App Secret globais
 * (necessários para montar a URL de autorização e trocar o código OAuth). */
export interface MetaAdsProvider {
  readonly name: string;

  buildAuthorizeUrl(redirectUri: string, state: string): string;
  exchangeCodeForToken(input: ExchangeCodeInput): Promise<ExchangeCodeResult>;
  exchangeForLongLivedToken(shortLivedToken: string): Promise<ExchangeCodeResult>;
  validateToken(credentials: MetaAdsOAuthCredentials): Promise<ValidateTokenResult>;
  getMe(credentials: MetaAdsOAuthCredentials): Promise<RemoteMetaUser>;

  listBusinesses(credentials: MetaAdsOAuthCredentials): Promise<RemoteBusiness[]>;
  listAdAccounts(
    credentials: MetaAdsOAuthCredentials,
    businessId: string | null,
  ): Promise<RemoteAdAccount[]>;
  listCampaigns(
    credentials: MetaAdsOAuthCredentials,
    adAccountMetaId: string,
  ): Promise<RemoteCampaign[]>;
  listAdSets(credentials: MetaAdsOAuthCredentials, campaignMetaId: string): Promise<RemoteAdSet[]>;
  listAds(credentials: MetaAdsOAuthCredentials, adSetMetaId: string): Promise<RemoteAd[]>;
  listCreatives(
    credentials: MetaAdsOAuthCredentials,
    adAccountMetaId: string,
  ): Promise<RemoteCreative[]>;
  listAudiences(
    credentials: MetaAdsOAuthCredentials,
    adAccountMetaId: string,
  ): Promise<RemoteAudience[]>;
  fetchInsights(
    credentials: MetaAdsOAuthCredentials,
    entityMetaId: string,
    input: FetchInsightsInput,
  ): Promise<RemoteInsightRow[]>;
  fetchConversionEvents(
    credentials: MetaAdsOAuthCredentials,
    adAccountMetaId: string,
    since: string,
    until: string,
  ): Promise<RemoteConversionEventRow[]>;
}
