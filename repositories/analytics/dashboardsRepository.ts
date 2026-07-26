import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AnalyticsDashboard, AnalyticsDashboardStatus } from "@/types/analytics";

interface DashboardRow {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  description: string | null;
  status: AnalyticsDashboardStatus;
  created_by: string | null;
  creator: { name: string | null; email: string | null } | null;
}

const DASHBOARD_SELECT = `
  id, created_at, updated_at, name, description, status, created_by,
  creator:profiles!analytics_dashboards_created_by_fkey (name, email)
`;

function mapDashboard(row: DashboardRow): AnalyticsDashboard {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    status: row.status,
    createdBy: row.created_by,
    createdByName: row.creator?.name ?? row.creator?.email ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface ListDashboardsOptions {
  status?: AnalyticsDashboardStatus;
  limit?: number;
}

export async function listDashboards(
  supabase: SupabaseClient,
  options: ListDashboardsOptions = {},
): Promise<AnalyticsDashboard[]> {
  let query = supabase.from("analytics_dashboards").select(DASHBOARD_SELECT);
  if (options.status) query = query.eq("status", options.status);

  query = query.order("updated_at", { ascending: false });
  if (options.limit) query = query.limit(options.limit);

  const { data, error } = await query;
  if (error) throw new Error(`Falha ao carregar dashboards: ${error.message}`);
  return ((data ?? []) as unknown as DashboardRow[]).map(mapDashboard);
}

export async function getDashboardById(
  supabase: SupabaseClient,
  id: string,
): Promise<AnalyticsDashboard | null> {
  const { data, error } = await supabase
    .from("analytics_dashboards")
    .select(DASHBOARD_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Falha ao carregar dashboard: ${error.message}`);
  if (!data) return null;
  return mapDashboard(data as unknown as DashboardRow);
}

export interface CreateDashboardPayload {
  name: string;
  description: string | null;
  createdBy: string | null;
}

export async function createDashboard(
  supabase: SupabaseClient,
  payload: CreateDashboardPayload,
): Promise<AnalyticsDashboard> {
  const { data, error } = await supabase
    .from("analytics_dashboards")
    .insert({ name: payload.name, description: payload.description, created_by: payload.createdBy })
    .select(DASHBOARD_SELECT)
    .single();

  if (error) throw new Error(`Falha ao criar dashboard: ${error.message}`);
  return mapDashboard(data as unknown as DashboardRow);
}

export interface UpdateDashboardPayload {
  name?: string;
  description?: string | null;
}

export async function updateDashboard(
  supabase: SupabaseClient,
  id: string,
  patch: UpdateDashboardPayload,
): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (patch.name !== undefined) payload.name = patch.name;
  if (patch.description !== undefined) payload.description = patch.description;

  const { error } = await supabase.from("analytics_dashboards").update(payload).eq("id", id);
  if (error) throw new Error(`Falha ao atualizar dashboard: ${error.message}`);
}

export async function setDashboardStatus(
  supabase: SupabaseClient,
  id: string,
  status: AnalyticsDashboardStatus,
): Promise<void> {
  const { error } = await supabase.from("analytics_dashboards").update({ status }).eq("id", id);
  if (error) throw new Error(`Falha ao atualizar status do dashboard: ${error.message}`);
}

export async function deleteDashboard(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("analytics_dashboards").delete().eq("id", id);
  if (error) throw new Error(`Falha ao excluir dashboard: ${error.message}`);
}
