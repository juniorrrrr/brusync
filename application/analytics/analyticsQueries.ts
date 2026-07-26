import "server-only";

import { requireCrmProfile } from "@/application/crm/authGuard";
import {
  getDashboardDetail,
  getDashboardsPageData,
} from "@/services/analytics/analyticsDashboardService";
import {
  getSharedDashboard,
  getSharesForDashboard,
} from "@/services/analytics/analyticsSharingService";
import { getSnapshotsForDashboard } from "@/services/analytics/analyticsSnapshotService";
import type {
  AnalyticsDashboardDetail,
  AnalyticsDashboardsPageData,
  AnalyticsShare,
  AnalyticsSnapshot,
} from "@/types/analytics";

/** Wrappers finos — mesmo padrão de application/team/teamQueries.ts e
 * application/ai/aiQueries.ts: guard de sessão + delega para
 * services/analytics/*, que já é 100% ciente de Modo Demonstração. */

export async function fetchDashboardsPageData(): Promise<AnalyticsDashboardsPageData> {
  const profile = await requireCrmProfile();
  return getDashboardsPageData(profile.id);
}

export async function fetchDashboardDetail(id: string): Promise<AnalyticsDashboardDetail | null> {
  const profile = await requireCrmProfile();
  return getDashboardDetail(id, profile.id);
}

export async function fetchSharesForDashboard(dashboardId: string): Promise<AnalyticsShare[]> {
  await requireCrmProfile();
  return getSharesForDashboard(dashboardId);
}

export async function fetchSnapshotsForDashboard(
  dashboardId: string,
): Promise<AnalyticsSnapshot[]> {
  await requireCrmProfile();
  return getSnapshotsForDashboard(dashboardId);
}

/** Rota pública interna de compartilhamento — ainda exige sessão (link
 * "público interno" = qualquer colaborador logado com o link, não a
 * internet), mas não exige ser o dono do dashboard. */
export async function fetchSharedDashboard(
  token: string,
): Promise<AnalyticsDashboardDetail | null> {
  await requireCrmProfile();
  return getSharedDashboard(token);
}
