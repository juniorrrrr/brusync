"use server";

import { revalidatePath } from "next/cache";
import { requireCrmProfile } from "@/application/crm/authGuard";
import { ANALYTICS_METRICS } from "@/domain/analytics/metricsCatalog";
import { WIDGET_SIZES, WIDGET_TYPES } from "@/domain/analytics/statusMeta";
import {
  addWidget,
  archiveDashboard,
  createDashboard,
  deleteDashboard,
  deleteWidget,
  duplicateDashboard,
  restoreDashboard,
  saveFilters,
  toggleDashboardFavorite,
  updateDashboardMeta,
  updateWidget,
} from "@/services/analytics/analyticsDashboardService";
import { revokeDashboardShare, shareDashboard } from "@/services/analytics/analyticsSharingService";
import { createDashboardSnapshot } from "@/services/analytics/analyticsSnapshotService";
import { isDemoModeActive } from "@/services/demo/demoMode";
import type {
  AnalyticsDataSource,
  AnalyticsFilterState,
  AnalyticsMetricKey,
  AnalyticsWidgetSize,
  AnalyticsWidgetType,
} from "@/types/analytics";

const DEMO_WRITE_BLOCKED_MESSAGE =
  "Ação indisponível em Modo Demonstração — nenhuma escrita é enviada ao banco.";

export interface AnalyticsActionState {
  status: "idle" | "success" | "error";
  message?: string;
  dashboardId?: string;
}

const INITIAL_STATE: AnalyticsActionState = { status: "idle" };

export { INITIAL_STATE as ANALYTICS_ACTION_INITIAL_STATE };

// ---------------------------------------------------------------------------
// Dashboards
// ---------------------------------------------------------------------------

export async function createDashboardAction(
  _prevState: AnalyticsActionState,
  formData: FormData,
): Promise<AnalyticsActionState> {
  const profile = await requireCrmProfile();
  if (await isDemoModeActive()) return { status: "error", message: DEMO_WRITE_BLOCKED_MESSAGE };

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  if (!name) return { status: "error", message: "Dê um nome ao dashboard." };

  const dashboard = await createDashboard(name, description, profile.id);
  revalidatePath("/analytics");
  return { status: "success", message: "Dashboard criado.", dashboardId: dashboard.id };
}

export async function updateDashboardAction(
  _prevState: AnalyticsActionState,
  formData: FormData,
): Promise<AnalyticsActionState> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return { status: "error", message: DEMO_WRITE_BLOCKED_MESSAGE };

  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  if (!id || !name) return { status: "error", message: "Dados inválidos." };

  await updateDashboardMeta(id, { name, description });
  revalidatePath("/analytics");
  return { status: "success", message: "Dashboard atualizado." };
}

export async function archiveDashboardAction(id: string): Promise<AnalyticsActionState> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return { status: "error", message: DEMO_WRITE_BLOCKED_MESSAGE };
  await archiveDashboard(id);
  revalidatePath("/analytics");
  return { status: "success" };
}

export async function restoreDashboardAction(id: string): Promise<AnalyticsActionState> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return { status: "error", message: DEMO_WRITE_BLOCKED_MESSAGE };
  await restoreDashboard(id);
  revalidatePath("/analytics");
  return { status: "success" };
}

export async function deleteDashboardAction(id: string): Promise<AnalyticsActionState> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return { status: "error", message: DEMO_WRITE_BLOCKED_MESSAGE };
  await deleteDashboard(id);
  revalidatePath("/analytics");
  return { status: "success" };
}

export async function duplicateDashboardAction(id: string): Promise<AnalyticsActionState> {
  const profile = await requireCrmProfile();
  if (await isDemoModeActive()) return { status: "error", message: DEMO_WRITE_BLOCKED_MESSAGE };

  const copy = await duplicateDashboard(id, profile.id);
  revalidatePath("/analytics");
  return copy
    ? { status: "success", dashboardId: copy.id }
    : { status: "error", message: "Dashboard não encontrado." };
}

export async function toggleDashboardFavoriteAction(
  dashboardId: string,
  favorite: boolean,
): Promise<{ ok: boolean }> {
  const profile = await requireCrmProfile();
  if (await isDemoModeActive()) return { ok: false };
  await toggleDashboardFavorite(dashboardId, profile.id, favorite);
  return { ok: true };
}

export async function saveDashboardFiltersAction(
  dashboardId: string,
  filters: AnalyticsFilterState,
): Promise<{ ok: boolean }> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return { ok: false };
  await saveFilters(dashboardId, filters);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Widgets
// ---------------------------------------------------------------------------

function isValidMetric(source: AnalyticsDataSource, metric: string): metric is AnalyticsMetricKey {
  return (
    metric in ANALYTICS_METRICS &&
    ANALYTICS_METRICS[metric as AnalyticsMetricKey].sources.includes(source)
  );
}

export async function addWidgetAction(
  _prevState: AnalyticsActionState,
  formData: FormData,
): Promise<AnalyticsActionState> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return { status: "error", message: DEMO_WRITE_BLOCKED_MESSAGE };

  const dashboardId = String(formData.get("dashboardId") ?? "").trim();
  const type = String(formData.get("type") ?? "") as AnalyticsWidgetType;
  const dataSource = String(formData.get("dataSource") ?? "") as AnalyticsDataSource;
  const metric = String(formData.get("metric") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const size = String(formData.get("size") ?? "medio") as AnalyticsWidgetSize;
  const position = Number(formData.get("position") ?? 0);

  if (!dashboardId) return { status: "error", message: "Dashboard não encontrado." };
  if (!WIDGET_TYPES.includes(type)) return { status: "error", message: "Tipo de widget inválido." };
  if (!WIDGET_SIZES.includes(size)) return { status: "error", message: "Tamanho inválido." };
  if (!isValidMetric(dataSource, metric)) {
    return { status: "error", message: "Métrica não disponível para essa fonte de dados." };
  }
  if (!title) return { status: "error", message: "Dê um título ao widget." };

  await addWidget({ dashboardId, type, dataSource, metric, title, size, position });
  revalidatePath(`/analytics/${dashboardId}`);
  return { status: "success", message: "Widget adicionado." };
}

export async function updateWidgetAction(
  _prevState: AnalyticsActionState,
  formData: FormData,
): Promise<AnalyticsActionState> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return { status: "error", message: DEMO_WRITE_BLOCKED_MESSAGE };

  const id = String(formData.get("id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const size = String(formData.get("size") ?? "") as AnalyticsWidgetSize;
  if (!id) return { status: "error", message: "Widget não encontrado." };

  await updateWidget(id, {
    title: title || undefined,
    size: WIDGET_SIZES.includes(size) ? size : undefined,
  });
  revalidatePath("/analytics");
  return { status: "success", message: "Widget atualizado." };
}

export async function deleteWidgetAction(id: string): Promise<AnalyticsActionState> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return { status: "error", message: DEMO_WRITE_BLOCKED_MESSAGE };
  await deleteWidget(id);
  revalidatePath("/analytics");
  return { status: "success" };
}

export async function reorderWidgetsAction(
  dashboardId: string,
  orderedIds: string[],
): Promise<{ ok: boolean }> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return { ok: false };
  await Promise.all(orderedIds.map((id, index) => updateWidget(id, { position: index })));
  revalidatePath(`/analytics/${dashboardId}`);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Compartilhamento e snapshots
// ---------------------------------------------------------------------------

export async function shareDashboardAction(dashboardId: string): Promise<AnalyticsActionState> {
  const profile = await requireCrmProfile();
  if (await isDemoModeActive()) return { status: "error", message: DEMO_WRITE_BLOCKED_MESSAGE };
  await shareDashboard(dashboardId, profile.id);
  revalidatePath(`/analytics/${dashboardId}`);
  return { status: "success", message: "Link de compartilhamento criado." };
}

export async function revokeShareAction(
  shareId: string,
  dashboardId: string,
): Promise<AnalyticsActionState> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return { status: "error", message: DEMO_WRITE_BLOCKED_MESSAGE };
  await revokeDashboardShare(shareId);
  revalidatePath(`/analytics/${dashboardId}`);
  return { status: "success" };
}

export async function createSnapshotAction(
  _prevState: AnalyticsActionState,
  formData: FormData,
): Promise<AnalyticsActionState> {
  const profile = await requireCrmProfile();
  if (await isDemoModeActive()) return { status: "error", message: DEMO_WRITE_BLOCKED_MESSAGE };

  const dashboardId = String(formData.get("dashboardId") ?? "").trim();
  const label = String(formData.get("label") ?? "").trim();
  if (!dashboardId || !label) return { status: "error", message: "Dê um nome ao snapshot." };

  await createDashboardSnapshot(dashboardId, label, profile.id);
  revalidatePath(`/analytics/${dashboardId}`);
  return { status: "success", message: "Snapshot salvo." };
}
