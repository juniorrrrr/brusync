import "server-only";

import { requireCrmProfile } from "@/application/crm/authGuard";
import { getDemoGa4DashboardData } from "@/lib/demo/mockGa4";
import {
  summarizeGa4ChannelBreakdown,
  summarizeGa4DeviceBreakdown,
} from "@/repositories/ga4/dimensionBreakdownRepository";
import { listGa4DailyMetrics, summarizeGa4Metrics } from "@/repositories/ga4/metricsRepository";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { getGa4Property } from "@/services/ga4/ga4AccountService";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type { Ga4DashboardData } from "@/types/ga4";

const DASHBOARD_WINDOW_DAYS = 30;

/** Único ponto de leitura consolidada do GA4 — mesmo papel de
 * application/metaAds/metaAdsQueries.ts::fetchMetaAdsDashboardData e
 * application/googleAds/googleAdsQueries.ts::fetchGoogleAdsDashboardData. */
export async function fetchGa4DashboardData(): Promise<Ga4DashboardData> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return getDemoGa4DashboardData();

  const property = await getGa4Property();
  if (!property) {
    return {
      property: null,
      summary: {
        sessions: 0,
        users: 0,
        newUsers: 0,
        engagedSessions: 0,
        engagementRate: null,
        pageViews: 0,
        conversions: 0,
        revenue: 0,
      },
      dailyMetrics: [],
      topChannels: [],
      topDevices: [],
      lastSyncAt: null,
    };
  }

  const supabase = await getSupabaseAuthClient();
  const since = new Date(Date.now() - DASHBOARD_WINDOW_DAYS * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const [dailyMetrics, topChannels, topDevices] = await Promise.all([
    listGa4DailyMetrics(supabase, property.id, since),
    summarizeGa4ChannelBreakdown(supabase, property.id),
    summarizeGa4DeviceBreakdown(supabase, property.id),
  ]);

  return {
    property,
    summary: summarizeGa4Metrics(dailyMetrics),
    dailyMetrics,
    topChannels,
    topDevices,
    lastSyncAt: property.lastSyncAt,
  };
}
