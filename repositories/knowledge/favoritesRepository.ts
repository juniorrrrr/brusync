import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

interface FavoriteRow {
  document_id: string;
  pinned: boolean;
}

export async function countAllFavorites(supabase: SupabaseClient): Promise<number> {
  const { count, error } = await supabase
    .from("crm_knowledge_favorites")
    .select("id", { count: "exact", head: true });
  if (error) throw new Error(`Falha ao contar favoritos: ${error.message}`);
  return count ?? 0;
}

export async function listFavoriteFlags(
  supabase: SupabaseClient,
  userId: string,
  documentIds: string[],
): Promise<Map<string, boolean>> {
  const map = new Map<string, boolean>();
  if (documentIds.length === 0) return map;

  const { data, error } = await supabase
    .from("crm_knowledge_favorites")
    .select("document_id, pinned")
    .eq("user_id", userId)
    .in("document_id", documentIds);
  if (error) throw new Error(`Falha ao carregar favoritos: ${error.message}`);

  for (const row of (data ?? []) as FavoriteRow[]) map.set(row.document_id, row.pinned);
  return map;
}

export async function listFavoriteDocumentIds(
  supabase: SupabaseClient,
  userId: string,
  pinnedOnly = false,
): Promise<string[]> {
  let query = supabase.from("crm_knowledge_favorites").select("document_id").eq("user_id", userId);
  if (pinnedOnly) query = query.eq("pinned", true);

  const { data, error } = await query;
  if (error) throw new Error(`Falha ao carregar favoritos: ${error.message}`);
  return ((data ?? []) as { document_id: string }[]).map((r) => r.document_id);
}

export async function toggleFavorite(
  supabase: SupabaseClient,
  documentId: string,
  userId: string,
): Promise<boolean> {
  const { data: existing, error: existingError } = await supabase
    .from("crm_knowledge_favorites")
    .select("id")
    .eq("document_id", documentId)
    .eq("user_id", userId)
    .maybeSingle();
  if (existingError) throw new Error(`Falha ao verificar favorito: ${existingError.message}`);

  if (existing) {
    const { error } = await supabase
      .from("crm_knowledge_favorites")
      .delete()
      .eq("id", (existing as { id: string }).id);
    if (error) throw new Error(`Falha ao remover favorito: ${error.message}`);
    return false;
  }

  const { error } = await supabase
    .from("crm_knowledge_favorites")
    .insert({ document_id: documentId, user_id: userId });
  if (error) throw new Error(`Falha ao favoritar documento: ${error.message}`);
  return true;
}

export async function setPinned(
  supabase: SupabaseClient,
  documentId: string,
  userId: string,
  pinned: boolean,
): Promise<void> {
  const { error } = await supabase
    .from("crm_knowledge_favorites")
    .upsert(
      { document_id: documentId, user_id: userId, pinned },
      { onConflict: "document_id,user_id" },
    );
  if (error) throw new Error(`Falha ao fixar documento: ${error.message}`);
}
