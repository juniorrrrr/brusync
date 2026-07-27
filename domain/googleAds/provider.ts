/** Camada de abstração da Google Ads API (Fase 35) — mesmo espírito de
 * domain/metaAds/provider.ts (Fase 29): nenhuma camada da aplicação fala
 * REST/GAQL diretamente, tudo passa por esta interface. Trocar/adicionar
 * provider é uma nova classe + um novo caso em
 * services/googleAds/googleAdsProviderFactory.ts — nenhum outro arquivo muda. */

export interface GoogleAdsCredentials {
  accessToken: string;
  /** Preenchido só ao sincronizar uma conta filha sob uma conta gerenciadora
   * (MCC) — vira o header `login-customer-id`. */
  loginCustomerId?: string;
}

export interface ValidateGoogleAdsTokenResult {
  ok: boolean;
  email?: string;
  error?: string;
}

export interface RemoteGoogleAdsCustomer {
  customerId: string;
  descriptiveName: string | null;
  currencyCode: string | null;
  timeZone: string | null;
  isManager: boolean;
}

export interface RemoteGoogleAdsCampaign {
  campaignId: string;
  name: string;
  channelType: string | null;
  status: string;
  budgetAmountMicros: number | null;
}

export interface RemoteGoogleAdsKeyword {
  keywordId: string;
  campaignId: string;
  adGroupName: string | null;
  text: string;
  matchType: string | null;
  status: string;
  clicks: number;
  impressions: number;
  costMicros: number;
}

export interface RemoteGoogleAdsDailyMetric {
  date: string;
  campaignId: string | null;
  impressions: number;
  clicks: number;
  costMicros: number;
  conversions: number;
  conversionsValue: number;
}

export interface FetchGoogleAdsMetricsInput {
  since: string;
  until: string;
}

/** Toda implementação (GoogleAdsRestClient hoje; um provider de sandbox no
 * futuro) recebe credenciais já resolvidas (descriptografadas) por quem a
 * instancia — nunca lê variável de ambiente por conta própria, exceto
 * client id/secret e developer token, globais, necessários para montar a
 * URL de autorização e assinar cada chamada. */
export interface GoogleAdsDataProvider {
  readonly name: string;

  buildAuthorizeUrl(redirectUri: string, state: string): string;
  exchangeCodeForToken(
    code: string,
    redirectUri: string,
  ): Promise<{
    accessToken: string;
    refreshToken: string | null;
    expiresInSeconds: number;
  }>;
  validateToken(credentials: GoogleAdsCredentials): Promise<ValidateGoogleAdsTokenResult>;

  listAccessibleCustomers(credentials: GoogleAdsCredentials): Promise<string[]>;
  getCustomerInfo(
    credentials: GoogleAdsCredentials,
    customerId: string,
  ): Promise<RemoteGoogleAdsCustomer>;
  listCampaigns(
    credentials: GoogleAdsCredentials,
    customerId: string,
  ): Promise<RemoteGoogleAdsCampaign[]>;
  listKeywords(
    credentials: GoogleAdsCredentials,
    customerId: string,
    campaignId: string,
  ): Promise<RemoteGoogleAdsKeyword[]>;
  fetchDailyMetrics(
    credentials: GoogleAdsCredentials,
    customerId: string,
    input: FetchGoogleAdsMetricsInput,
  ): Promise<RemoteGoogleAdsDailyMetric[]>;
}
