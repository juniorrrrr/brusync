import "server-only";

import { getDemoAnalyticsShareByToken, getDemoAnalyticsShares } from "@/lib/demo/mockAnalytics";
import {
  createShare,
  getShareByToken,
  listShares,
  revokeShare,
} from "@/repositories/analytics/sharesRepository";
import { getDashboardDetail } from "@/services/analytics/analyticsDashboardService";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type { AnalyticsDashboardDetail, AnalyticsShare } from "@/types/analytics";

export async function getSharesForDashboard(dashboardId: string): Promise<AnalyticsShare[]> {
  if (await isDemoModeActive()) return getDemoAnalyticsShares(dashboardId);
  const supabase = await getSupabaseAuthClient();
  return listShares(supabase, dashboardId);
}

export async function shareDashboard(
  dashboardId: string,
  createdBy: string | null,
): Promise<AnalyticsShare> {
  const supabase = await getSupabaseAuthClient();
  return createShare(supabase, dashboardId, createdBy);
}

export async function revokeDashboardShare(id: string): Promise<void> {
  const supabase = await getSupabaseAuthClient();
  await revokeShare(supabase, id);
}

/** Link de leitura interno — resolve o token para o dashboard somente
 * leitura (mesmos dados, mesma camada de aplicação; a única diferença é que
 * a tela de destino não mostra o modo de edição). */
export async function getSharedDashboard(token: string): Promise<AnalyticsDashboardDetail | null> {
  if (await isDemoModeActive()) {
    const share = getDemoAnalyticsShareByToken(token);
    return share ? getDashboardDetail(share.dashboardId, null) : null;
  }

  const supabase = await getSupabaseAuthClient();
  const share = await getShareByToken(supabase, token);
  if (!share) return null;
  return getDashboardDetail(share.dashboardId, null);
}
