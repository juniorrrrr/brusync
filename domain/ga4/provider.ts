/** Camada de abstração exigida pela Fase 35 para GA4 — nenhuma camada da
 * aplicação fala com a Analytics Admin/Data API diretamente; tudo passa por
 * esta interface. Mesmo padrão de domain/metaAds/provider.ts (Fase 29): a
 * troca de implementação (ex.: um futuro provider de sandbox/mock) é só uma
 * nova classe + um novo caso em services/ga4/ga4ProviderFactory.ts. */

export interface Ga4Credentials {
  accessToken: string;
}

export interface ValidateGa4TokenResult {
  ok: boolean;
  error?: string;
}

export interface RemoteGa4Property {
  propertyId: string;
  displayName: string | null;
  timeZone: string | null;
  currencyCode: string | null;
}

export interface RemoteGa4OverviewRow {
  date: string;
  sessions: number;
  users: number;
  newUsers: number;
  engagedSessions: number;
  engagementRate: number | null;
  pageViews: number;
  conversions: number;
  revenue: number;
}

export interface RemoteGa4DimensionRow {
  date: string;
  dimensionValue: string;
  sessions: number;
  users: number;
  conversions: number;
}

export interface Ga4ReportRange {
  since: string;
  until: string;
}

/** Toda implementação recebe as credenciais já resolvidas (descriptografadas
 * e renovadas, se necessário) por quem a instancia — nunca lê variável de
 * ambiente ou tabela por conta própria, exceto GOOGLE_CLIENT_ID/SECRET
 * (necessários para o fluxo OAuth, resolvidos em services/googleIntegrations/
 * googleOAuthClient.ts, não aqui). */
export interface Ga4DataProvider {
  readonly name: string;

  validateToken(credentials: Ga4Credentials): Promise<ValidateGa4TokenResult>;
  listProperties(credentials: Ga4Credentials): Promise<RemoteGa4Property[]>;
  runOverviewReport(
    credentials: Ga4Credentials,
    propertyId: string,
    range: Ga4ReportRange,
  ): Promise<RemoteGa4OverviewRow[]>;
  runChannelBreakdownReport(
    credentials: Ga4Credentials,
    propertyId: string,
    range: Ga4ReportRange,
  ): Promise<RemoteGa4DimensionRow[]>;
  runDeviceBreakdownReport(
    credentials: Ga4Credentials,
    propertyId: string,
    range: Ga4ReportRange,
  ): Promise<RemoteGa4DimensionRow[]>;
}
