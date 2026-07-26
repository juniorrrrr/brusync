import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AnalyticsDataSource,
  AnalyticsMetricKey,
  AnalyticsWidget,
  AnalyticsWidgetConfig,
  AnalyticsWidgetSize,
  AnalyticsWidgetType,
} from "@/types/analytics";

interface WidgetRow {
  id: string;
  created_at: string;
  updated_at: string;
  dashboard_id: string;
  type: AnalyticsWidgetType;
  data_source: AnalyticsDataSource;
  metric: AnalyticsMetricKey;
  title: string;
  size: AnalyticsWidgetSize;
  position: number;
  config: AnalyticsWidgetConfig | null;
}

const WIDGET_SELECT =
  "id, created_at, updated_at, dashboard_id, type, data_source, metric, title, size, position, config";

function mapWidget(row: WidgetRow): AnalyticsWidget {
  return {
    id: row.id,
    dashboardId: row.dashboard_id,
    type: row.type,
    dataSource: row.data_source,
    metric: row.metric,
    title: row.title,
    size: row.size,
    position: row.position,
    config: row.config ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listWidgets(
  supabase: SupabaseClient,
  dashboardId: string,
): Promise<AnalyticsWidget[]> {
  const { data, error } = await supabase
    .from("analytics_widgets")
    .select(WIDGET_SELECT)
    .eq("dashboard_id", dashboardId)
    .order("position", { ascending: true });

  if (error) throw new Error(`Falha ao carregar widgets: ${error.message}`);
  return ((data ?? []) as WidgetRow[]).map(mapWidget);
}

export interface CreateWidgetPayload {
  dashboardId: string;
  type: AnalyticsWidgetType;
  dataSource: AnalyticsDataSource;
  metric: AnalyticsMetricKey;
  title: string;
  size: AnalyticsWidgetSize;
  position: number;
  config?: AnalyticsWidgetConfig;
}

export async function createWidget(
  supabase: SupabaseClient,
  payload: CreateWidgetPayload,
): Promise<AnalyticsWidget> {
  const { data, error } = await supabase
    .from("analytics_widgets")
    .insert({
      dashboard_id: payload.dashboardId,
      type: payload.type,
      data_source: payload.dataSource,
      metric: payload.metric,
      title: payload.title,
      size: payload.size,
      position: payload.position,
      config: payload.config ?? {},
    })
    .select(WIDGET_SELECT)
    .single();

  if (error) throw new Error(`Falha ao criar widget: ${error.message}`);
  return mapWidget(data as WidgetRow);
}

export interface UpdateWidgetPayload {
  title?: string;
  size?: AnalyticsWidgetSize;
  position?: number;
  config?: AnalyticsWidgetConfig;
}

export async function updateWidget(
  supabase: SupabaseClient,
  id: string,
  patch: UpdateWidgetPayload,
): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (patch.title !== undefined) payload.title = patch.title;
  if (patch.size !== undefined) payload.size = patch.size;
  if (patch.position !== undefined) payload.position = patch.position;
  if (patch.config !== undefined) payload.config = patch.config;

  const { error } = await supabase.from("analytics_widgets").update(payload).eq("id", id);
  if (error) throw new Error(`Falha ao atualizar widget: ${error.message}`);
}

export async function deleteWidget(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("analytics_widgets").delete().eq("id", id);
  if (error) throw new Error(`Falha ao excluir widget: ${error.message}`);
}

export async function duplicateWidgetsForDashboard(
  supabase: SupabaseClient,
  fromDashboardId: string,
  toDashboardId: string,
): Promise<void> {
  const widgets = await listWidgets(supabase, fromDashboardId);
  if (widgets.length === 0) return;

  const { error } = await supabase.from("analytics_widgets").insert(
    widgets.map((widget) => ({
      dashboard_id: toDashboardId,
      type: widget.type,
      data_source: widget.dataSource,
      metric: widget.metric,
      title: widget.title,
      size: widget.size,
      position: widget.position,
      config: widget.config,
    })),
  );
  if (error) throw new Error(`Falha ao duplicar widgets: ${error.message}`);
}
