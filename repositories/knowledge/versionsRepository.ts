import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { KnowledgeBlock, KnowledgeVersion } from "@/types/knowledge";

interface VersionRow {
  id: string;
  document_id: string;
  version_number: number;
  title: string;
  content_json: KnowledgeBlock[];
  summary: string | null;
  change_note: string | null;
  created_at: string;
  creator?: { name: string | null; email: string | null } | null;
}

const VERSION_SELECT = `
  id, document_id, version_number, title, content_json, summary, change_note, created_at,
  creator:profiles!crm_knowledge_versions_created_by_fkey (name, email)
`;

function mapVersion(row: VersionRow): KnowledgeVersion {
  return {
    id: row.id,
    documentId: row.document_id,
    versionNumber: row.version_number,
    title: row.title,
    contentJson: row.content_json,
    summary: row.summary,
    changeNote: row.change_note,
    createdByName: row.creator?.name ?? row.creator?.email ?? null,
    createdAt: row.created_at,
  };
}

export async function listVersions(
  supabase: SupabaseClient,
  documentId: string,
): Promise<KnowledgeVersion[]> {
  const { data, error } = await supabase
    .from("crm_knowledge_versions")
    .select(VERSION_SELECT)
    .eq("document_id", documentId)
    .order("version_number", { ascending: false });

  if (error) throw new Error(`Falha ao carregar versões: ${error.message}`);
  return ((data ?? []) as unknown as VersionRow[]).map(mapVersion);
}

export async function getVersion(
  supabase: SupabaseClient,
  versionId: string,
): Promise<KnowledgeVersion | null> {
  const { data, error } = await supabase
    .from("crm_knowledge_versions")
    .select(VERSION_SELECT)
    .eq("id", versionId)
    .maybeSingle();

  if (error) throw new Error(`Falha ao carregar versão: ${error.message}`);
  return data ? mapVersion(data as unknown as VersionRow) : null;
}

export interface CreateVersionPayload {
  documentId: string;
  versionNumber: number;
  title: string;
  contentJson: KnowledgeBlock[];
  summary: string | null;
  changeNote: string | null;
  createdBy: string | null;
}

/** Snapshots the document's state BEFORE an update is applied — called by
 * knowledgeDocumentService right before documentsRepository.updateDocument,
 * so a version row always represents "what it looked like up to this
 * point", never overwritten afterwards. */
export async function createVersion(
  supabase: SupabaseClient,
  payload: CreateVersionPayload,
): Promise<{ id: string }> {
  const { data, error } = await supabase
    .from("crm_knowledge_versions")
    .insert({
      document_id: payload.documentId,
      version_number: payload.versionNumber,
      title: payload.title,
      content_json: payload.contentJson,
      summary: payload.summary,
      change_note: payload.changeNote,
      created_by: payload.createdBy,
    })
    .select("id")
    .single();

  if (error) throw new Error(`Falha ao salvar versão: ${error.message}`);
  return data as { id: string };
}
