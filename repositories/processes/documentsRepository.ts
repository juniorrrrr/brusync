import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProcessDocumentLink } from "@/types/processes";

interface DocumentLinkRow {
  process_id: string;
  document_id: string;
  created_at: string;
  document?: { title: string; category?: { name: string } | null } | null;
}

const DOCUMENT_LINK_SELECT = `
  process_id, document_id, created_at,
  document:crm_knowledge_documents!crm_process_documents_document_id_fkey(
    title,
    category:crm_knowledge_categories!crm_knowledge_documents_category_id_fkey(name)
  )
`;

function mapLink(row: DocumentLinkRow): ProcessDocumentLink {
  return {
    processId: row.process_id,
    documentId: row.document_id,
    documentTitle: row.document?.title ?? "",
    documentCategoryName: row.document?.category?.name ?? null,
    createdAt: row.created_at,
  };
}

export async function listDocumentsForProcess(
  supabase: SupabaseClient,
  processId: string,
): Promise<ProcessDocumentLink[]> {
  const { data, error } = await supabase
    .from("crm_process_documents")
    .select(DOCUMENT_LINK_SELECT)
    .eq("process_id", processId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Falha ao carregar documentos vinculados: ${error.message}`);
  return ((data ?? []) as unknown as DocumentLinkRow[]).map(mapLink);
}

export async function linkDocument(
  supabase: SupabaseClient,
  processId: string,
  documentId: string,
  createdBy: string | null,
): Promise<void> {
  const { error } = await supabase
    .from("crm_process_documents")
    .insert({ process_id: processId, document_id: documentId, created_by: createdBy });
  if (error) throw new Error(`Falha ao vincular documento: ${error.message}`);
}

export async function unlinkDocument(
  supabase: SupabaseClient,
  processId: string,
  documentId: string,
): Promise<void> {
  const { error } = await supabase
    .from("crm_process_documents")
    .delete()
    .eq("process_id", processId)
    .eq("document_id", documentId);
  if (error) throw new Error(`Falha ao desvincular documento: ${error.message}`);
}
