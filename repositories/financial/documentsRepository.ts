import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { FinancialDocument, FinancialDocumentType } from "@/types/financial";

export const FINANCIAL_DOCUMENTS_BUCKET = "crm-financial-documents";

interface DocumentRow {
  id: string;
  transaction_id: string;
  document_type: FinancialDocumentType;
  storage_path: string;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  uploaded_by: string | null;
  created_at: string;
  uploader?: { name: string | null; email: string | null } | null;
}

const DOCUMENT_SELECT = `
  id, transaction_id, document_type, storage_path, file_name, file_size, mime_type, uploaded_by, created_at,
  uploader:profiles!crm_financial_documents_uploaded_by_fkey (name, email)
`;

function mapDocument(row: DocumentRow): FinancialDocument {
  return {
    id: row.id,
    transactionId: row.transaction_id,
    documentType: row.document_type,
    storagePath: row.storage_path,
    fileName: row.file_name,
    fileSize: row.file_size,
    mimeType: row.mime_type,
    uploadedBy: row.uploaded_by,
    uploadedByName: row.uploader?.name ?? row.uploader?.email ?? null,
    createdAt: row.created_at,
  };
}

export async function listDocumentsForTransaction(
  supabase: SupabaseClient,
  transactionId: string,
): Promise<FinancialDocument[]> {
  const { data, error } = await supabase
    .from("crm_financial_documents")
    .select(DOCUMENT_SELECT)
    .eq("transaction_id", transactionId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Falha ao carregar documentos: ${error.message}`);
  return ((data ?? []) as unknown as DocumentRow[]).map(mapDocument);
}

export async function uploadDocument(
  supabase: SupabaseClient,
  params: {
    transactionId: string;
    documentType: FinancialDocumentType;
    file: File;
    uploadedBy: string;
  },
): Promise<FinancialDocument> {
  const { transactionId, documentType, file, uploadedBy } = params;
  const storagePath = `${transactionId}/${crypto.randomUUID()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from(FINANCIAL_DOCUMENTS_BUCKET)
    .upload(storagePath, file, { contentType: file.type || undefined });

  if (uploadError) throw new Error(`Falha ao enviar documento: ${uploadError.message}`);

  const { data, error } = await supabase
    .from("crm_financial_documents")
    .insert({
      transaction_id: transactionId,
      document_type: documentType,
      storage_path: storagePath,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type || null,
      uploaded_by: uploadedBy,
    })
    .select(DOCUMENT_SELECT)
    .single();

  if (error) {
    await supabase.storage.from(FINANCIAL_DOCUMENTS_BUCKET).remove([storagePath]);
    throw new Error(`Falha ao salvar metadados do documento: ${error.message}`);
  }

  return mapDocument(data as unknown as DocumentRow);
}

export async function getDocumentSignedUrl(
  supabase: SupabaseClient,
  storagePath: string,
  expiresInSeconds = 60,
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(FINANCIAL_DOCUMENTS_BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error || !data) throw new Error(`Falha ao gerar link do documento: ${error?.message}`);
  return data.signedUrl;
}

export async function deleteDocument(
  supabase: SupabaseClient,
  documentId: string,
  storagePath: string,
): Promise<void> {
  const { error: storageError } = await supabase.storage
    .from(FINANCIAL_DOCUMENTS_BUCKET)
    .remove([storagePath]);
  if (storageError) throw new Error(`Falha ao remover documento: ${storageError.message}`);

  const { error } = await supabase.from("crm_financial_documents").delete().eq("id", documentId);
  if (error) throw new Error(`Falha ao remover registro do documento: ${error.message}`);
}
