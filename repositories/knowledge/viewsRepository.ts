import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { KnowledgeViewAction, KnowledgeViewEntry } from "@/types/knowledge";

export async function recordView(
  supabase: SupabaseClient,
  params: {
    documentId: string;
    userId: string | null;
    action: KnowledgeViewAction;
    fileId?: string | null;
  },
): Promise<void> {
  const { error } = await supabase.from("crm_knowledge_views").insert({
    document_id: params.documentId,
    user_id: params.userId,
    action: params.action,
    file_id: params.fileId ?? null,
  });
  if (error) throw new Error(`Falha ao registrar visualização: ${error.message}`);
}

export async function countViewsForDocuments(
  supabase: SupabaseClient,
  documentIds: string[],
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (documentIds.length === 0) return map;

  const { data, error } = await supabase
    .from("crm_knowledge_views")
    .select("document_id")
    .eq("action", "view")
    .in("document_id", documentIds);
  if (error) throw new Error(`Falha ao contar visualizações: ${error.message}`);

  for (const row of (data ?? []) as { document_id: string }[]) {
    map.set(row.document_id, (map.get(row.document_id) ?? 0) + 1);
  }
  return map;
}

export async function countTotalViews(supabase: SupabaseClient): Promise<number> {
  const { count, error } = await supabase
    .from("crm_knowledge_views")
    .select("id", { count: "exact", head: true })
    .eq("action", "view");
  if (error) throw new Error(`Falha ao contar visualizações: ${error.message}`);
  return count ?? 0;
}

/** Document ids ranked by view count, most accessed first — used by the
 * dashboard and by the "mais acessados" favorites tab. Aggregation happens
 * in JS from the raw event rows (same approach as
 * viewsRepository.countViewsForDocuments) since PostgREST has no
 * group-by-count-and-sort primitive reachable from the JS client here. */
export async function rankDocumentsByViews(
  supabase: SupabaseClient,
  limit: number,
): Promise<{ documentId: string; count: number }[]> {
  const { data, error } = await supabase
    .from("crm_knowledge_views")
    .select("document_id")
    .eq("action", "view");
  if (error) throw new Error(`Falha ao calcular documentos mais acessados: ${error.message}`);

  const counts = new Map<string, number>();
  for (const row of (data ?? []) as { document_id: string }[]) {
    counts.set(row.document_id, (counts.get(row.document_id) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([documentId, count]) => ({ documentId, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

interface ViewRow {
  id: string;
  document_id: string;
  file_id: string | null;
  action: KnowledgeViewAction;
  viewed_at: string;
  document: { title: string } | null;
  file: { file_name: string } | null;
  user: { name: string | null; email: string | null } | null;
}

const VIEW_SELECT = `
  id, document_id, file_id, action, viewed_at,
  document:crm_knowledge_documents!crm_knowledge_views_document_id_fkey (title),
  file:crm_knowledge_files!crm_knowledge_views_file_id_fkey (file_name),
  user:profiles!crm_knowledge_views_user_id_fkey (name, email)
`;

function mapView(row: ViewRow): KnowledgeViewEntry {
  return {
    id: row.id,
    documentId: row.document_id,
    documentTitle: row.document?.title ?? "Documento removido",
    fileId: row.file_id,
    fileName: row.file?.file_name ?? null,
    action: row.action,
    userName: row.user?.name ?? row.user?.email ?? null,
    viewedAt: row.viewed_at,
  };
}

export async function listHistoryForDocument(
  supabase: SupabaseClient,
  documentId: string,
  limit = 50,
): Promise<KnowledgeViewEntry[]> {
  const { data, error } = await supabase
    .from("crm_knowledge_views")
    .select(VIEW_SELECT)
    .eq("document_id", documentId)
    .order("viewed_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Falha ao carregar histórico: ${error.message}`);
  return ((data ?? []) as unknown as ViewRow[]).map(mapView);
}

export async function listRecentActivity(
  supabase: SupabaseClient,
  limit = 30,
): Promise<KnowledgeViewEntry[]> {
  const { data, error } = await supabase
    .from("crm_knowledge_views")
    .select(VIEW_SELECT)
    .order("viewed_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Falha ao carregar atividade recente: ${error.message}`);
  return ((data ?? []) as unknown as ViewRow[]).map(mapView);
}
