import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export async function listFavoriteDashboardIds(
  supabase: SupabaseClient,
  userId: string,
): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("analytics_favorites")
    .select("dashboard_id")
    .eq("user_id", userId);

  if (error) throw new Error(`Falha ao carregar favoritos: ${error.message}`);
  return new Set(((data ?? []) as { dashboard_id: string }[]).map((row) => row.dashboard_id));
}

export async function addFavorite(
  supabase: SupabaseClient,
  dashboardId: string,
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from("analytics_favorites")
    .upsert({ dashboard_id: dashboardId, user_id: userId }, { onConflict: "dashboard_id,user_id" });
  if (error) throw new Error(`Falha ao favoritar dashboard: ${error.message}`);
}

export async function removeFavorite(
  supabase: SupabaseClient,
  dashboardId: string,
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from("analytics_favorites")
    .delete()
    .eq("dashboard_id", dashboardId)
    .eq("user_id", userId);
  if (error) throw new Error(`Falha ao remover favorito: ${error.message}`);
}
