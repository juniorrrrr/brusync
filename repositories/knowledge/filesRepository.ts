import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { knowledgeFileKindFromName } from "@/domain/knowledge/types";
import type { KnowledgeFile } from "@/types/knowledge";

export const KNOWLEDGE_FILES_BUCKET = "crm-knowledge-files";

interface FileRow {
  id: string;
  document_id: string | null;
  storage_path: string;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  kind: KnowledgeFile["kind"];
  created_at: string;
  uploader?: { name: string | null; email: string | null } | null;
}

const FILE_SELECT = `
  id, document_id, storage_path, file_name, file_size, mime_type, kind, created_at,
  uploader:profiles!crm_knowledge_files_uploaded_by_fkey (name, email)
`;

function mapFile(row: FileRow): KnowledgeFile {
  return {
    id: row.id,
    documentId: row.document_id,
    storagePath: row.storage_path,
    fileName: row.file_name,
    fileSize: row.file_size,
    mimeType: row.mime_type,
    kind: row.kind,
    uploadedByName: row.uploader?.name ?? row.uploader?.email ?? null,
    createdAt: row.created_at,
  };
}

export async function listFilesForDocument(
  supabase: SupabaseClient,
  documentId: string,
): Promise<KnowledgeFile[]> {
  const { data, error } = await supabase
    .from("crm_knowledge_files")
    .select(FILE_SELECT)
    .eq("document_id", documentId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Falha ao carregar arquivos: ${error.message}`);
  return ((data ?? []) as unknown as FileRow[]).map(mapFile);
}

export interface ListAllFilesOptions {
  search?: string;
  kind?: KnowledgeFile["kind"];
  limit?: number;
  offset?: number;
}

export async function countAllFiles(supabase: SupabaseClient): Promise<number> {
  const { count, error } = await supabase
    .from("crm_knowledge_files")
    .select("id", { count: "exact", head: true });
  if (error) throw new Error(`Falha ao contar arquivos: ${error.message}`);
  return count ?? 0;
}

export async function listAllFiles(
  supabase: SupabaseClient,
  options: ListAllFilesOptions = {},
): Promise<{ files: KnowledgeFile[]; total: number }> {
  let query = supabase.from("crm_knowledge_files").select(FILE_SELECT, { count: "exact" });
  if (options.kind) query = query.eq("kind", options.kind);
  if (options.search)
    query = query.ilike("file_name", `%${options.search.replace(/[,()%]/g, " ").trim()}%`);

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(options.offset ?? 0, (options.offset ?? 0) + (options.limit ?? 50) - 1);

  if (error) throw new Error(`Falha ao carregar biblioteca de arquivos: ${error.message}`);
  const files = ((data ?? []) as unknown as FileRow[]).map(mapFile);
  return { files, total: count ?? files.length };
}

export async function uploadKnowledgeFile(
  supabase: SupabaseClient,
  params: {
    documentId: string | null;
    file: File;
    uploadedBy: string;
  },
): Promise<KnowledgeFile> {
  const { documentId, file, uploadedBy } = params;
  const storagePath = `${documentId ?? "biblioteca"}/${crypto.randomUUID()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from(KNOWLEDGE_FILES_BUCKET)
    .upload(storagePath, file, { contentType: file.type || undefined });
  if (uploadError) throw new Error(`Falha ao enviar arquivo: ${uploadError.message}`);

  const { data, error } = await supabase
    .from("crm_knowledge_files")
    .insert({
      document_id: documentId,
      storage_path: storagePath,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type || null,
      kind: knowledgeFileKindFromName(file.name, file.type),
      uploaded_by: uploadedBy,
    })
    .select(FILE_SELECT)
    .single();

  if (error) {
    await supabase.storage.from(KNOWLEDGE_FILES_BUCKET).remove([storagePath]);
    throw new Error(`Falha ao salvar metadados do arquivo: ${error.message}`);
  }

  return mapFile(data as unknown as FileRow);
}

export async function getFileById(
  supabase: SupabaseClient,
  fileId: string,
): Promise<KnowledgeFile | null> {
  const { data, error } = await supabase
    .from("crm_knowledge_files")
    .select(FILE_SELECT)
    .eq("id", fileId)
    .maybeSingle();
  if (error) throw new Error(`Falha ao carregar arquivo: ${error.message}`);
  return data ? mapFile(data as unknown as FileRow) : null;
}

export async function getFileSignedUrl(
  supabase: SupabaseClient,
  storagePath: string,
  expiresInSeconds = 60,
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(KNOWLEDGE_FILES_BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error || !data) throw new Error(`Falha ao gerar link do arquivo: ${error?.message}`);
  return data.signedUrl;
}

export async function deleteKnowledgeFile(
  supabase: SupabaseClient,
  fileId: string,
  storagePath: string,
): Promise<void> {
  const { error: storageError } = await supabase.storage
    .from(KNOWLEDGE_FILES_BUCKET)
    .remove([storagePath]);
  if (storageError) throw new Error(`Falha ao remover arquivo: ${storageError.message}`);

  const { error } = await supabase.from("crm_knowledge_files").delete().eq("id", fileId);
  if (error) throw new Error(`Falha ao remover registro do arquivo: ${error.message}`);
}
