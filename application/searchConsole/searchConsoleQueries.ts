import "server-only";

import { requireCrmProfile } from "@/application/crm/authGuard";
import { getDemoSearchConsoleDashboardData } from "@/lib/demo/mockSearchConsole";
import { listSearchConsolePages } from "@/repositories/searchConsole/pagesRepository";
import { listSearchConsoleQueries } from "@/repositories/searchConsole/queriesRepository";
import { listSearchConsoleSitemaps } from "@/repositories/searchConsole/sitemapsRepository";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { getSearchConsoleSite } from "@/services/searchConsole/searchConsoleAccountService";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type { SearchConsoleDashboardData } from "@/types/searchConsole";

/** Único ponto de leitura consolidada do Search Console — mesmo papel de
 * application/metaAds/metaAdsQueries.ts::fetchMetaAdsDashboardData. */
export async function fetchSearchConsoleDashboardData(): Promise<SearchConsoleDashboardData> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return getDemoSearchConsoleDashboardData();

  const site = await getSearchConsoleSite();
  if (!site) {
    return {
      site: null,
      summary: { clicks: 0, impressions: 0, ctr: null, avgPosition: null },
      topQueries: [],
      topPages: [],
      sitemaps: [],
      lastSyncAt: null,
    };
  }

  const supabase = await getSupabaseAuthClient();
  const [topQueries, topPages, sitemaps] = await Promise.all([
    listSearchConsoleQueries(supabase, site.id),
    listSearchConsolePages(supabase, site.id),
    listSearchConsoleSitemaps(supabase, site.id),
  ]);

  const totalClicks = topQueries.reduce((sum, q) => sum + q.clicks, 0);
  const totalImpressions = topQueries.reduce((sum, q) => sum + q.impressions, 0);
  const weightedPosition = topQueries.reduce(
    (sum, q) => sum + (q.position ?? 0) * q.impressions,
    0,
  );

  return {
    site,
    summary: {
      clicks: totalClicks,
      impressions: totalImpressions,
      ctr: totalImpressions > 0 ? Math.round((totalClicks / totalImpressions) * 10000) / 100 : null,
      avgPosition:
        totalImpressions > 0 ? Math.round((weightedPosition / totalImpressions) * 100) / 100 : null,
    },
    topQueries,
    topPages,
    sitemaps,
    lastSyncAt: site.lastSyncAt,
  };
}
