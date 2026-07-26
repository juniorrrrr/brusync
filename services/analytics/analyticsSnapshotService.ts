import "server-only";

import { getDemoAnalyticsSnapshots } from "@/lib/demo/mockAnalytics";
import {
  createSnapshot,
  getSnapshotById,
  listSnapshots,
} from "@/repositories/analytics/snapshotsRepository";
import { getDashboardDetail } from "@/services/analytics/analyticsDashboardService";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type { AnalyticsSnapshot } from "@/types/analytics";

export async function getSnapshotsForDashboard(dashboardId: string): Promise<AnalyticsSnapshot[]> {
  if (await isDemoModeActive()) return getDemoAnalyticsSnapshots(dashboardId);
  const supabase = await getSupabaseAuthClient();
  return listSnapshots(supabase, dashboardId);
}

/** Congela o estado ATUAL (widgets + filtros) do dashboard — nunca os
 * valores calculados; comparar dois snapshots reroda cada um com os dados
 * de HOJE (mesma limitação documentada da Fase 23 para métricas sem quebra
 * histórica). */
export async function createDashboardSnapshot(
  dashboardId: string,
  label: string,
  createdBy: string | null,
): Promise<void> {
  const detail = await getDashboardDetail(dashboardId, createdBy);
  if (!detail) throw new Error("Dashboard não encontrado.");

  const supabase = await getSupabaseAuthClient();
  await createSnapshot(supabase, {
    dashboardId,
    label,
    state: { widgets: detail.widgets, filters: detail.filters },
    createdBy,
  });
}

export async function getSnapshotDetail(id: string): Promise<AnalyticsSnapshot | null> {
  const supabase = await getSupabaseAuthClient();
  return getSnapshotById(supabase, id);
}
