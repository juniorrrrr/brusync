import "server-only";

import type {
  RemoteSearchAnalyticsRow,
  RemoteSearchConsoleSite,
  RemoteSitemap,
  SearchAnalyticsRange,
  SearchConsoleCredentials,
  SearchConsoleDataProvider,
  ValidateSearchConsoleTokenResult,
} from "@/domain/searchConsole/provider";

const API_BASE = "https://www.googleapis.com/webmasters/v3";

async function searchConsoleRequest<T>(
  path: string,
  accessToken: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE}/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = data?.error?.message ?? `Erro ${response.status} na Search Console API.`;
    throw new Error(message);
  }
  return data as T;
}

const ROW_LIMIT = 200;

/** Implementação real (fetch-based, sem SDK) — mesmo padrão de
 * services/metaAds/metaMarketingProvider.ts. A URL Inspection API (índice/
 * cobertura por URL individual) não é usada aqui por não ter um endpoint em
 * lote — a Fase 35 mantém indexed_count/excluded_count nulos em vez de
 * inventar um proxy, ver services/searchConsole/searchConsoleSyncService.ts. */
export class SearchConsoleRestClient implements SearchConsoleDataProvider {
  readonly name = "search_console_v3_api";

  async validateToken(
    credentials: SearchConsoleCredentials,
  ): Promise<ValidateSearchConsoleTokenResult> {
    try {
      await searchConsoleRequest("sites", credentials.accessToken);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "Token inválido." };
    }
  }

  async listSites(credentials: SearchConsoleCredentials): Promise<RemoteSearchConsoleSite[]> {
    const data = await searchConsoleRequest<{
      siteEntry?: { siteUrl: string; permissionLevel?: string }[];
    }>("sites", credentials.accessToken);
    return (data.siteEntry ?? []).map((s) => ({
      siteUrl: s.siteUrl,
      permissionLevel: s.permissionLevel ?? null,
    }));
  }

  async queryAnalytics(
    credentials: SearchConsoleCredentials,
    siteUrl: string,
    dimension: "query" | "page",
    range: SearchAnalyticsRange,
  ): Promise<RemoteSearchAnalyticsRow[]> {
    const data = await searchConsoleRequest<{
      rows?: {
        keys: string[];
        clicks: number;
        impressions: number;
        ctr: number;
        position: number;
      }[];
    }>(`sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, credentials.accessToken, {
      method: "POST",
      body: JSON.stringify({
        startDate: range.since,
        endDate: range.until,
        dimensions: [dimension],
        rowLimit: ROW_LIMIT,
      }),
    });

    return (data.rows ?? []).map((row) => ({
      key: row.keys[0] ?? "",
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position,
    }));
  }

  async listSitemaps(
    credentials: SearchConsoleCredentials,
    siteUrl: string,
  ): Promise<RemoteSitemap[]> {
    const data = await searchConsoleRequest<{
      sitemap?: {
        path: string;
        isPending?: boolean;
        errors?: number;
        warnings?: number;
        lastSubmitted?: string;
        lastDownloaded?: string;
      }[];
    }>(`sites/${encodeURIComponent(siteUrl)}/sitemaps`, credentials.accessToken);

    return (data.sitemap ?? []).map((s) => ({
      path: s.path,
      isPending: s.isPending ?? false,
      errors: s.errors ?? 0,
      warnings: s.warnings ?? 0,
      lastSubmitted: s.lastSubmitted ?? null,
      lastDownloaded: s.lastDownloaded ?? null,
    }));
  }
}
