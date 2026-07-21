import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { type LeadFileRow, mapLeadFile } from "@/repositories/crm/mappers";
import type { LeadFile } from "@/types/crm";

export const LEAD_FILES_BUCKET = "crm-lead-files";

export async function listFilesForLead(
  supabase: SupabaseClient,
  crmLeadId: string,
): Promise<LeadFile[]> {
  const { data, error } = await supabase
    .from("crm_lead_files")
    .select(
      "id, crm_lead_id, storage_path, file_name, file_size, mime_type, uploaded_by, created_at",
    )
    .eq("crm_lead_id", crmLeadId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Falha ao carregar arquivos: ${error.message}`);
  return ((data ?? []) as LeadFileRow[]).map(mapLeadFile);
}

export async function uploadLeadFile(
  supabase: SupabaseClient,
  params: {
    crmLeadId: string;
    file: File;
    uploadedBy: string;
  },
): Promise<LeadFile> {
  const { crmLeadId, file, uploadedBy } = params;
  const storagePath = `${crmLeadId}/${crypto.randomUUID()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from(LEAD_FILES_BUCKET)
    .upload(storagePath, file, { contentType: file.type || undefined });

  if (uploadError) throw new Error(`Falha ao enviar arquivo: ${uploadError.message}`);

  const { data, error } = await supabase
    .from("crm_lead_files")
    .insert({
      crm_lead_id: crmLeadId,
      storage_path: storagePath,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type || null,
      uploaded_by: uploadedBy,
    })
    .select(
      "id, crm_lead_id, storage_path, file_name, file_size, mime_type, uploaded_by, created_at",
    )
    .single();

  if (error) {
    await supabase.storage.from(LEAD_FILES_BUCKET).remove([storagePath]);
    throw new Error(`Falha ao salvar metadados do arquivo: ${error.message}`);
  }

  return mapLeadFile(data);
}

export async function getFileSignedUrl(
  supabase: SupabaseClient,
  storagePath: string,
  expiresInSeconds = 60,
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(LEAD_FILES_BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error || !data) throw new Error(`Falha ao gerar link do arquivo: ${error?.message}`);
  return data.signedUrl;
}

export async function deleteLeadFile(
  supabase: SupabaseClient,
  fileId: string,
  storagePath: string,
): Promise<void> {
  const { error: storageError } = await supabase.storage
    .from(LEAD_FILES_BUCKET)
    .remove([storagePath]);
  if (storageError) throw new Error(`Falha ao remover arquivo: ${storageError.message}`);

  const { error } = await supabase.from("crm_lead_files").delete().eq("id", fileId);
  if (error) throw new Error(`Falha ao remover registro do arquivo: ${error.message}`);
}
