import "server-only";

import { getOwnerOptions } from "@/application/crm/leadsQueries";
import { DEFAULT_ANALYTICS_FILTERS } from "@/domain/analytics/filters";
import {
  getDemoAnalyticsDashboardDetail,
  getDemoAnalyticsDashboards,
  getDemoFavoriteAnalyticsDashboards,
} from "@/lib/demo/mockAnalytics";
import {
  createDashboard as createDashboardRow,
  deleteDashboard as deleteDashboardRow,
  getDashboardById,
  listDashboards,
  setDashboardStatus,
  updateDashboard as updateDashboardRow,
} from "@/repositories/analytics/dashboardsRepository";
import {
  addFavorite,
  listFavoriteDashboardIds,
  removeFavorite,
} from "@/repositories/analytics/favoritesRepository";
import {
  getDashboardFilters,
  saveDashboardFilters,
} from "@/repositories/analytics/filtersRepository";
import {
  type CreateWidgetPayload,
  createWidget as createWidgetRow,
  deleteWidget as deleteWidgetRow,
  duplicateWidgetsForDashboard,
  listWidgets,
  type UpdateWidgetPayload,
  updateWidget as updateWidgetRow,
} from "@/repositories/analytics/widgetsRepository";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type {
  AnalyticsDashboard,
  AnalyticsDashboardDetail,
  AnalyticsDashboardsPageData,
  AnalyticsFilterState,
} from "@/types/analytics";

export async function getDashboardsPageData(
  userId: string | null,
): Promise<AnalyticsDashboardsPageData> {
  const [ownerOptions] = await Promise.all([getOwnerOptions()]);

  if (await isDemoModeActive()) {
    const dashboards = getDemoAnalyticsDashboards();
    return {
      dashboards,
      favorites: getDemoFavoriteAnalyticsDashboards(),
      recent: [...dashboards].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)).slice(0, 5),
      shared: [],
      ownerOptions,
    };
  }

  const supabase = await getSupabaseAuthClient();
  const [dashboards, favoriteIds] = await Promise.all([
    listDashboards(supabase, { status: "ativo" }),
    userId ? listFavoriteDashboardIds(supabase, userId) : Promise.resolve(new Set<string>()),
  ]);

  return {
    dashboards,
    favorites: dashboards.filter((d) => favoriteIds.has(d.id)),
    recent: [...dashboards].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)).slice(0, 5),
    shared: [],
    ownerOptions,
  };
}

export async function getDashboardDetail(
  id: string,
  userId: string | null,
): Promise<AnalyticsDashboardDetail | null> {
  if (await isDemoModeActive()) return getDemoAnalyticsDashboardDetail(id);

  const supabase = await getSupabaseAuthClient();
  const dashboard = await getDashboardById(supabase, id);
  if (!dashboard) return null;

  const [widgets, filters, favoriteIds] = await Promise.all([
    listWidgets(supabase, id),
    getDashboardFilters(supabase, id),
    userId ? listFavoriteDashboardIds(supabase, userId) : Promise.resolve(new Set<string>()),
  ]);

  return { ...dashboard, widgets, filters, isFavorite: favoriteIds.has(id) };
}

export async function createDashboard(
  name: string,
  description: string | null,
  createdBy: string | null,
): Promise<AnalyticsDashboard> {
  const supabase = await getSupabaseAuthClient();
  return createDashboardRow(supabase, { name, description, createdBy });
}

export async function updateDashboardMeta(
  id: string,
  patch: { name?: string; description?: string | null },
): Promise<void> {
  const supabase = await getSupabaseAuthClient();
  await updateDashboardRow(supabase, id, patch);
}

export async function archiveDashboard(id: string): Promise<void> {
  const supabase = await getSupabaseAuthClient();
  await setDashboardStatus(supabase, id, "arquivado");
}

export async function restoreDashboard(id: string): Promise<void> {
  const supabase = await getSupabaseAuthClient();
  await setDashboardStatus(supabase, id, "ativo");
}

export async function deleteDashboard(id: string): Promise<void> {
  const supabase = await getSupabaseAuthClient();
  await deleteDashboardRow(supabase, id);
}

export async function duplicateDashboard(
  id: string,
  createdBy: string | null,
): Promise<AnalyticsDashboard | null> {
  const supabase = await getSupabaseAuthClient();
  const original = await getDashboardById(supabase, id);
  if (!original) return null;

  const copy = await createDashboardRow(supabase, {
    name: `${original.name} (cópia)`,
    description: original.description,
    createdBy,
  });
  await duplicateWidgetsForDashboard(supabase, id, copy.id);

  const filters = await getDashboardFilters(supabase, id);
  await saveDashboardFilters(supabase, copy.id, filters);

  return copy;
}

export async function saveFilters(
  dashboardId: string,
  filters: AnalyticsFilterState,
): Promise<void> {
  const supabase = await getSupabaseAuthClient();
  await saveDashboardFilters(supabase, dashboardId, filters);
}

export async function addWidget(payload: CreateWidgetPayload) {
  const supabase = await getSupabaseAuthClient();
  return createWidgetRow(supabase, payload);
}

export async function updateWidget(id: string, patch: UpdateWidgetPayload): Promise<void> {
  const supabase = await getSupabaseAuthClient();
  await updateWidgetRow(supabase, id, patch);
}

export async function deleteWidget(id: string): Promise<void> {
  const supabase = await getSupabaseAuthClient();
  await deleteWidgetRow(supabase, id);
}

export async function toggleDashboardFavorite(
  dashboardId: string,
  userId: string,
  favorite: boolean,
): Promise<void> {
  const supabase = await getSupabaseAuthClient();
  if (favorite) await addFavorite(supabase, dashboardId, userId);
  else await removeFavorite(supabase, dashboardId, userId);
}

export { DEFAULT_ANALYTICS_FILTERS };
