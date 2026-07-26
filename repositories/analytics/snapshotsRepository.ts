import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AnalyticsFilterState, AnalyticsSnapshot, AnalyticsWidget } from "@/types/analytics";

interface SnapshotRow {
  id: string;
  created_at: string;
  dashboard_id: string;
  label: string;
  state: { widgets: AnalyticsWidget[]; filters: AnalyticsFilterState };
  created_by: string | null;
  creator: { name: string | null; email: string | null } | null;
}

const SNAPSHOT_SELECT = `
  id, created_at, dashboard_id, label, state, created_by,
  creator:profiles!analytics_snapshots_created_by_fkey (name, email)
`;

function mapSnapshot(row: SnapshotRow): AnalyticsSnapshot {
  return {
    id: row.id,
    dashboardId: row.dashboard_id,
    label: row.label,
    state: row.state,
    createdBy: row.created_by,
    createdByName: row.creator?.name ?? row.creator?.email ?? null,
    createdAt: row.created_at,
  };
}

export async function listSnapshots(
  supabase: SupabaseClient,
  dashboardId: string,
): Promise<AnalyticsSnapshot[]> {
  const { data, error } = await supabase
    .from("analytics_snapshots")
    .select(SNAPSHOT_SELECT)
    .eq("dashboard_id", dashboardId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Falha ao carregar snapshots: ${error.message}`);
  return ((data ?? []) as unknown as SnapshotRow[]).map(mapSnapshot);
}

export async function getSnapshotById(
  supabase: SupabaseClient,
  id: string,
): Promise<AnalyticsSnapshot | null> {
  const { data, error } = await supabase
    .from("analytics_snapshots")
    .select(SNAPSHOT_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Falha ao carregar snapshot: ${error.message}`);
  if (!data) return null;
  return mapSnapshot(data as unknown as SnapshotRow);
}

export interface CreateSnapshotPayload {
  dashboardId: string;
  label: string;
  state: { widgets: AnalyticsWidget[]; filters: AnalyticsFilterState };
  createdBy: string | null;
}

export async function createSnapshot(
  supabase: SupabaseClient,
  payload: CreateSnapshotPayload,
): Promise<void> {
  const { error } = await supabase.from("analytics_snapshots").insert({
    dashboard_id: payload.dashboardId,
    label: payload.label,
    state: payload.state,
    created_by: payload.createdBy,
  });
  if (error) throw new Error(`Falha ao salvar snapshot: ${error.message}`);
}
