"use server";

import { requireCrmProfile } from "@/application/crm/authGuard";
import {
  deleteDocument,
  getDocumentSignedUrl,
  listDocumentsForTransaction,
  uploadDocument,
} from "@/repositories/financial/documentsRepository";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type { FinancialDocumentType } from "@/types/financial";

const DEMO_WRITE_BLOCKED_MESSAGE =
  "Ação indisponível em Modo Demonstração — nenhuma escrita é enviada ao banco.";

const MAX_DOCUMENT_SIZE_BYTES = 15 * 1024 * 1024;

export interface DocumentActionState {
  status: "idle" | "success" | "error";
  message?: string;
}

export async function fetchFinancialDocuments(transactionId: string) {
  await requireCrmProfile();
  if (await isDemoModeActive()) return [];

  const supabase = await getSupabaseAuthClient();
  return listDocumentsForTransaction(supabase, transactionId);
}

export async function uploadFinancialDocumentAction(
  _prevState: DocumentActionState,
  formData: FormData,
): Promise<DocumentActionState> {
  const profile = await requireCrmProfile();
  if (await isDemoModeActive()) return { status: "error", message: DEMO_WRITE_BLOCKED_MESSAGE };

  const transactionId = String(formData.get("transactionId") ?? "").trim();
  const documentType = String(formData.get("documentType") ?? "outro") as FinancialDocumentType;
  const file = formData.get("file");

  if (!transactionId || !(file instanceof File) || file.size === 0) {
    return { status: "error", message: "Selecione um arquivo." };
  }
  if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
    return { status: "error", message: "Arquivo maior que 15MB." };
  }

  const supabase = await getSupabaseAuthClient();
  await uploadDocument(supabase, { transactionId, documentType, file, uploadedBy: profile.id });
  return { status: "success", message: "Documento enviado." };
}

export async function getFinancialDocumentDownloadUrlAction(
  storagePath: string,
): Promise<{ url: string | null; error?: string }> {
  await requireCrmProfile();
  try {
    const supabase = await getSupabaseAuthClient();
    const url = await getDocumentSignedUrl(supabase, storagePath, 60);
    return { url };
  } catch (err) {
    return { url: null, error: err instanceof Error ? err.message : "Falha ao gerar link." };
  }
}

export async function deleteFinancialDocumentAction(
  documentId: string,
  storagePath: string,
): Promise<{ ok: boolean; error?: string }> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return { ok: false, error: DEMO_WRITE_BLOCKED_MESSAGE };

  const supabase = await getSupabaseAuthClient();
  await deleteDocument(supabase, documentId, storagePath);
  return { ok: true };
}
