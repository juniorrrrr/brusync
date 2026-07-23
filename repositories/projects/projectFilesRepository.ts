import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProjectFile } from "@/types/projects";

export const PROJECT_FILES_BUCKET = "crm-project-files";

interface ProjectFileRow {
  id: string;
  project_id: string;
  task_id: string | null;
  storage_path: string;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  uploaded_by: string | null;
  created_at: string;
  uploader?: { name: string | null; email: string | null } | null;
}

const PROJECT_FILE_SELECT = `
  id, project_id, task_id, storage_path, file_name, file_size, mime_type, uploaded_by, created_at,
  uploader:profiles!crm_project_files_uploaded_by_fkey (name, email)
`;

function mapProjectFile(row: ProjectFileRow): ProjectFile {
  return {
    id: row.id,
    projectId: row.project_id,
    taskId: row.task_id,
    storagePath: row.storage_path,
    fileName: row.file_name,
    fileSize: row.file_size,
    mimeType: row.mime_type,
    uploadedBy: row.uploaded_by,
    uploadedByName: row.uploader?.name ?? row.uploader?.email ?? null,
    createdAt: row.created_at,
  };
}

export async function listFilesForProject(
  supabase: SupabaseClient,
  projectId: string,
): Promise<ProjectFile[]> {
  const { data, error } = await supabase
    .from("crm_project_files")
    .select(PROJECT_FILE_SELECT)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Falha ao carregar arquivos do projeto: ${error.message}`);
  return ((data ?? []) as unknown as ProjectFileRow[]).map(mapProjectFile);
}

export async function uploadProjectFile(
  supabase: SupabaseClient,
  params: { projectId: string; taskId: string | null; file: File; uploadedBy: string },
): Promise<ProjectFile> {
  const { projectId, taskId, file, uploadedBy } = params;
  const storagePath = `${projectId}/${crypto.randomUUID()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from(PROJECT_FILES_BUCKET)
    .upload(storagePath, file, { contentType: file.type || undefined });

  if (uploadError) throw new Error(`Falha ao enviar arquivo: ${uploadError.message}`);

  const { data, error } = await supabase
    .from("crm_project_files")
    .insert({
      project_id: projectId,
      task_id: taskId,
      storage_path: storagePath,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type || null,
      uploaded_by: uploadedBy,
    })
    .select(PROJECT_FILE_SELECT)
    .single();

  if (error) {
    await supabase.storage.from(PROJECT_FILES_BUCKET).remove([storagePath]);
    throw new Error(`Falha ao salvar metadados do arquivo: ${error.message}`);
  }

  return mapProjectFile(data as unknown as ProjectFileRow);
}

export async function getProjectFileSignedUrl(
  supabase: SupabaseClient,
  storagePath: string,
  expiresInSeconds = 60,
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(PROJECT_FILES_BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error || !data) throw new Error(`Falha ao gerar link do arquivo: ${error?.message}`);
  return data.signedUrl;
}

export async function deleteProjectFile(
  supabase: SupabaseClient,
  fileId: string,
  storagePath: string,
): Promise<void> {
  const { error: storageError } = await supabase.storage
    .from(PROJECT_FILES_BUCKET)
    .remove([storagePath]);
  if (storageError) throw new Error(`Falha ao remover arquivo: ${storageError.message}`);

  const { error } = await supabase.from("crm_project_files").delete().eq("id", fileId);
  if (error) throw new Error(`Falha ao remover registro do arquivo: ${error.message}`);
}
