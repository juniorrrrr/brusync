import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AnalyticsShare } from "@/types/analytics";

interface ShareRow {
  id: string;
  created_at: string;
  dashboard_id: string;
  share_token: string;
  created_by: string | null;
  revoked_at: string | null;
}

const SHARE_SELECT = "id, created_at, dashboard_id, share_token, created_by, revoked_at";

function mapShare(row: ShareRow): AnalyticsShare {
  return {
    id: row.id,
    dashboardId: row.dashboard_id,
    shareToken: row.share_token,
    createdBy: row.created_by,
    createdAt: row.created_at,
    revokedAt: row.revoked_at,
  };
}

export async function listShares(
  supabase: SupabaseClient,
  dashboardId: string,
): Promise<AnalyticsShare[]> {
  const { data, error } = await supabase
    .from("analytics_shares")
    .select(SHARE_SELECT)
    .eq("dashboard_id", dashboardId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Falha ao carregar compartilhamentos: ${error.message}`);
  return ((data ?? []) as ShareRow[]).map(mapShare);
}

export async function getShareByToken(
  supabase: SupabaseClient,
  token: string,
): Promise<AnalyticsShare | null> {
  const { data, error } = await supabase
    .from("analytics_shares")
    .select(SHARE_SELECT)
    .eq("share_token", token)
    .is("revoked_at", null)
    .maybeSingle();

  if (error) throw new Error(`Falha ao carregar link compartilhado: ${error.message}`);
  if (!data) return null;
  return mapShare(data as ShareRow);
}

export async function createShare(
  supabase: SupabaseClient,
  dashboardId: string,
  createdBy: string | null,
): Promise<AnalyticsShare> {
  const { data, error } = await supabase
    .from("analytics_shares")
    .insert({ dashboard_id: dashboardId, created_by: createdBy })
    .select(SHARE_SELECT)
    .single();

  if (error) throw new Error(`Falha ao criar compartilhamento: ${error.message}`);
  return mapShare(data as ShareRow);
}

export async function revokeShare(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase
    .from("analytics_shares")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(`Falha ao revogar compartilhamento: ${error.message}`);
}
