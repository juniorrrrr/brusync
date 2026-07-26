import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProcessFile } from "@/types/processes";

export const PROCESS_FILES_BUCKET = "crm-process-files";

interface FileRow {
  id: string;
  process_id: string;
  storage_path: string;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  created_at: string;
  uploader?: { name: string | null; email: string | null } | null;
}

const FILE_SELECT = `
  id, process_id, storage_path, file_name, file_size, mime_type, created_at,
  uploader:profiles!crm_process_files_uploaded_by_fkey(name, email)
`;

function mapFile(row: FileRow): ProcessFile {
  return {
    id: row.id,
    processId: row.process_id,
    storagePath: row.storage_path,
    fileName: row.file_name,
    fileSize: row.file_size,
    mimeType: row.mime_type,
    uploadedByName: row.uploader?.name ?? row.uploader?.email ?? null,
    createdAt: row.created_at,
  };
}

export async function listFilesForProcess(
  supabase: SupabaseClient,
  processId: string,
): Promise<ProcessFile[]> {
  const { data, error } = await supabase
    .from("crm_process_files")
    .select(FILE_SELECT)
    .eq("process_id", processId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Falha ao carregar arquivos do processo: ${error.message}`);
  return ((data ?? []) as unknown as FileRow[]).map(mapFile);
}

export async function uploadProcessFile(
  supabase: SupabaseClient,
  params: { processId: string; file: File; uploadedBy: string },
): Promise<ProcessFile> {
  const { processId, file, uploadedBy } = params;
  const storagePath = `${processId}/${crypto.randomUUID()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from(PROCESS_FILES_BUCKET)
    .upload(storagePath, file, { contentType: file.type || undefined });
  if (uploadError) throw new Error(`Falha ao enviar arquivo: ${uploadError.message}`);

  const { data, error } = await supabase
    .from("crm_process_files")
    .insert({
      process_id: processId,
      storage_path: storagePath,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type || null,
      uploaded_by: uploadedBy,
    })
    .select(FILE_SELECT)
    .single();

  if (error) {
    await supabase.storage.from(PROCESS_FILES_BUCKET).remove([storagePath]);
    throw new Error(`Falha ao salvar metadados do arquivo: ${error.message}`);
  }

  return mapFile(data as unknown as FileRow);
}

export async function getProcessFileSignedUrl(
  supabase: SupabaseClient,
  storagePath: string,
  expiresInSeconds = 60,
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(PROCESS_FILES_BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error || !data) throw new Error(`Falha ao gerar link do arquivo: ${error?.message}`);
  return data.signedUrl;
}

export async function deleteProcessFile(
  supabase: SupabaseClient,
  fileId: string,
  storagePath: string,
): Promise<void> {
  const { error: storageError } = await supabase.storage
    .from(PROCESS_FILES_BUCKET)
    .remove([storagePath]);
  if (storageError) throw new Error(`Falha ao remover arquivo: ${storageError.message}`);

  const { error } = await supabase.from("crm_process_files").delete().eq("id", fileId);
  if (error) throw new Error(`Falha ao remover registro do arquivo: ${error.message}`);
}
