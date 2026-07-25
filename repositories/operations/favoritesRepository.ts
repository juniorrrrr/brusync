import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { OperationsFavorite, OperationsFavoriteEntityType } from "@/types/operations";

interface FavoriteRow {
  id: string;
  entity_type: OperationsFavoriteEntityType;
  entity_id: string;
  label: string;
  href: string | null;
  created_at: string;
}

function mapFavorite(row: FavoriteRow): OperationsFavorite {
  return {
    id: row.id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    label: row.label,
    href: row.href,
    createdAt: row.created_at,
  };
}

export async function listFavoritesForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<OperationsFavorite[]> {
  const { data, error } = await supabase
    .from("operations_favorites")
    .select("id, entity_type, entity_id, label, href, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Falha ao carregar favoritos: ${error.message}`);
  return ((data ?? []) as FavoriteRow[]).map(mapFavorite);
}

export async function addFavorite(
  supabase: SupabaseClient,
  params: {
    userId: string;
    entityType: OperationsFavoriteEntityType;
    entityId: string;
    label: string;
    href: string | null;
  },
): Promise<void> {
  const { error } = await supabase.from("operations_favorites").insert({
    user_id: params.userId,
    entity_type: params.entityType,
    entity_id: params.entityId,
    label: params.label,
    href: params.href,
  });
  if (error) throw new Error(`Falha ao favoritar: ${error.message}`);
}

export async function removeFavorite(
  supabase: SupabaseClient,
  userId: string,
  entityType: OperationsFavoriteEntityType,
  entityId: string,
): Promise<void> {
  const { error } = await supabase
    .from("operations_favorites")
    .delete()
    .eq("user_id", userId)
    .eq("entity_type", entityType)
    .eq("entity_id", entityId);
  if (error) throw new Error(`Falha ao remover favorito: ${error.message}`);
}
