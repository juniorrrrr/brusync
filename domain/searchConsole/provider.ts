/** Camada de abstração da Search Console API (Fase 35) — mesmo espírito de
 * domain/metaAds/provider.ts (Fase 29): nenhuma camada da aplicação fala
 * REST diretamente, tudo passa por esta interface. */

export interface SearchConsoleCredentials {
  accessToken: string;
}

export interface ValidateSearchConsoleTokenResult {
  ok: boolean;
  error?: string;
}

export interface RemoteSearchConsoleSite {
  siteUrl: string;
  permissionLevel: string | null;
}

export interface RemoteSearchAnalyticsRow {
  key: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface RemoteSitemap {
  path: string;
  isPending: boolean;
  errors: number;
  warnings: number;
  lastSubmitted: string | null;
  lastDownloaded: string | null;
}

export interface SearchAnalyticsRange {
  since: string;
  until: string;
}

/** Toda implementação recebe credenciais já resolvidas por quem a
 * instancia — nunca lê variável de ambiente ou tabela por conta própria,
 * exceto GOOGLE_CLIENT_ID/SECRET (resolvidos em services/googleIntegrations/
 * googleOAuthClient.ts, não aqui). */
export interface SearchConsoleDataProvider {
  readonly name: string;

  validateToken(credentials: SearchConsoleCredentials): Promise<ValidateSearchConsoleTokenResult>;
  listSites(credentials: SearchConsoleCredentials): Promise<RemoteSearchConsoleSite[]>;
  queryAnalytics(
    credentials: SearchConsoleCredentials,
    siteUrl: string,
    dimension: "query" | "page",
    range: SearchAnalyticsRange,
  ): Promise<RemoteSearchAnalyticsRow[]>;
  listSitemaps(credentials: SearchConsoleCredentials, siteUrl: string): Promise<RemoteSitemap[]>;
}
