export type SearchConsoleConnectionStatus = "conectado" | "desconectado" | "erro";

export interface SearchConsoleSite {
  id: string;
  siteUrl: string;
  permissionLevel: string | null;
  isSynced: boolean;
  status: SearchConsoleConnectionStatus;
  lastSyncAt: string | null;
  error: string | null;
  indexedCount: number | null;
  excludedCount: number | null;
  coverageCheckedAt: string | null;
  clientId: string | null;
  responsibleId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SearchConsoleQuery {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number | null;
  position: number | null;
}

export interface SearchConsolePage {
  pageUrl: string;
  clicks: number;
  impressions: number;
  ctr: number | null;
  position: number | null;
}

export interface SearchConsoleSitemap {
  sitemapUrl: string;
  status: string | null;
  isPending: boolean;
  errorsCount: number;
  warningsCount: number;
  submittedAt: string | null;
  lastDownloadedAt: string | null;
}

export interface SearchConsoleSummary {
  clicks: number;
  impressions: number;
  ctr: number | null;
  avgPosition: number | null;
}

export interface SearchConsoleDashboardData {
  site: SearchConsoleSite | null;
  summary: SearchConsoleSummary;
  topQueries: SearchConsoleQuery[];
  topPages: SearchConsolePage[];
  sitemaps: SearchConsoleSitemap[];
  lastSyncAt: string | null;
}
