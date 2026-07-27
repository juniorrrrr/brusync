import type {
  SearchConsoleDashboardData,
  SearchConsolePage,
  SearchConsoleQuery,
  SearchConsoleSite,
  SearchConsoleSitemap,
} from "@/types/searchConsole";

const now = new Date();
function daysAgoIso(days: number): string {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
}

export const DEMO_SEARCH_CONSOLE_SITE: SearchConsoleSite = {
  id: "00000000-sc00-4000-8000-000000000001",
  siteUrl: "https://brusync.com.br/",
  permissionLevel: "siteOwner",
  isSynced: true,
  status: "conectado",
  lastSyncAt: daysAgoIso(0),
  error: null,
  indexedCount: 128,
  excludedCount: 14,
  coverageCheckedAt: daysAgoIso(0),
  clientId: null,
  responsibleId: null,
  createdAt: daysAgoIso(60),
  updatedAt: daysAgoIso(0),
};

const QUERY_SEEDS: { query: string; clicks: number; impressions: number; position: number }[] = [
  { query: "software white label", clicks: 210, impressions: 4200, position: 3.2 },
  { query: "crm personalizado", clicks: 165, impressions: 3100, position: 4.8 },
  { query: "sistema de gestão empresarial", clicks: 140, impressions: 5600, position: 6.1 },
  { query: "brusync", clicks: 120, impressions: 900, position: 1.1 },
  { query: "dashboard executivo whitelabel", clicks: 88, impressions: 2100, position: 5.4 },
  { query: "integração de sistemas", clicks: 76, impressions: 3400, position: 8.2 },
  { query: "automação comercial", clicks: 61, impressions: 2700, position: 9.6 },
  { query: "central omnichannel", clicks: 54, impressions: 1500, position: 4.3 },
  { query: "plataforma saas b2b", clicks: 40, impressions: 1900, position: 11.2 },
  { query: "erp para agências", clicks: 33, impressions: 1200, position: 12.7 },
];

const PAGE_SEEDS: { path: string; clicks: number; impressions: number; position: number }[] = [
  { path: "/", clicks: 320, impressions: 6200, position: 2.4 },
  { path: "/cases/dashboard-executivo-white-label", clicks: 145, impressions: 2800, position: 4.1 },
  { path: "/cases/crm-comercial-inteligente", clicks: 98, impressions: 2100, position: 5.6 },
  {
    path: "/blog/white-label-empresas-abandonando-softwares-genericos",
    clicks: 87,
    impressions: 3400,
    position: 6.8,
  },
  {
    path: "/materiais/como-criar-software-white-label",
    clicks: 62,
    impressions: 1900,
    position: 7.9,
  },
];

const SITEMAP_SEEDS: SearchConsoleSitemap[] = [
  {
    sitemapUrl: "https://brusync.com.br/sitemap.xml",
    status: "ok",
    isPending: false,
    errorsCount: 0,
    warningsCount: 0,
    submittedAt: daysAgoIso(45),
    lastDownloadedAt: daysAgoIso(0),
  },
  {
    sitemapUrl: "https://brusync.com.br/sitemap-blog.xml",
    status: "com_erros",
    isPending: false,
    errorsCount: 1,
    warningsCount: 2,
    submittedAt: daysAgoIso(45),
    lastDownloadedAt: daysAgoIso(1),
  },
];

function calcCtr(clicks: number, impressions: number): number {
  return Math.round((clicks / impressions) * 10000) / 100;
}

export function getDemoSearchConsoleSite(): SearchConsoleSite {
  return DEMO_SEARCH_CONSOLE_SITE;
}

export function getDemoSearchConsoleDashboardData(): SearchConsoleDashboardData {
  const topQueries: SearchConsoleQuery[] = QUERY_SEEDS.map((seed) => ({
    query: seed.query,
    clicks: seed.clicks,
    impressions: seed.impressions,
    ctr: calcCtr(seed.clicks, seed.impressions),
    position: seed.position,
  }));

  const topPages: SearchConsolePage[] = PAGE_SEEDS.map((seed) => ({
    pageUrl: seed.path,
    clicks: seed.clicks,
    impressions: seed.impressions,
    ctr: calcCtr(seed.clicks, seed.impressions),
    position: seed.position,
  }));

  const totalClicks = topQueries.reduce((sum, q) => sum + q.clicks, 0);
  const totalImpressions = topQueries.reduce((sum, q) => sum + q.impressions, 0);
  const avgPosition =
    topQueries.reduce((sum, q) => sum + (q.position ?? 0) * q.impressions, 0) / totalImpressions;

  return {
    site: DEMO_SEARCH_CONSOLE_SITE,
    summary: {
      clicks: totalClicks,
      impressions: totalImpressions,
      ctr: calcCtr(totalClicks, totalImpressions),
      avgPosition: Math.round(avgPosition * 100) / 100,
    },
    topQueries,
    topPages,
    sitemaps: SITEMAP_SEEDS,
    lastSyncAt: DEMO_SEARCH_CONSOLE_SITE.lastSyncAt,
  };
}
