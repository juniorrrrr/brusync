"use server";

import { revalidatePath } from "next/cache";
import { requireCrmProfile } from "@/application/crm/authGuard";
import { getDemoKnowledgeFiles } from "@/lib/demo/mockKnowledge";
import * as filesRepo from "@/repositories/knowledge/filesRepository";
import * as viewsRepo from "@/repositories/knowledge/viewsRepository";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type { KnowledgeFile } from "@/types/knowledge";

const DEMO_WRITE_BLOCKED_MESSAGE =
  "Ação indisponível em Modo Demonstração — nenhuma escrita é enviada ao banco.";
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

export async function fetchKnowledgeFilesForDocument(documentId: string): Promise<KnowledgeFile[]> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return getDemoKnowledgeFiles(documentId);

  const supabase = await getSupabaseAuthClient();
  return filesRepo.listFilesForDocument(supabase, documentId);
}

export interface KnowledgeFileListOptions {
  search?: string;
  kind?: KnowledgeFile["kind"];
  limit?: number;
  offset?: number;
}

export async function fetchKnowledgeFileLibrary(
  options: KnowledgeFileListOptions = {},
): Promise<{ files: KnowledgeFile[]; total: number }> {
  await requireCrmProfile();
  if (await isDemoModeActive()) {
    const files = getDemoKnowledgeFiles(null);
    return { files, total: files.length };
  }

  const supabase = await getSupabaseAuthClient();
  return filesRepo.listAllFiles(supabase, options);
}

export interface FileActionState {
  status: "idle" | "success" | "error";
  message?: string;
  file?: KnowledgeFile;
}

export async function uploadKnowledgeFileAction(
  _prevState: FileActionState,
  formData: FormData,
): Promise<FileActionState> {
  const profile = await requireCrmProfile();
  if (await isDemoModeActive()) return { status: "error", message: DEMO_WRITE_BLOCKED_MESSAGE };

  const documentId = String(formData.get("documentId") ?? "").trim();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0)
    return { status: "error", message: "Selecione um arquivo." };
  if (file.size > MAX_FILE_SIZE_BYTES)
    return { status: "error", message: "Arquivo maior que 25MB." };

  const supabase = await getSupabaseAuthClient();
  const uploaded = await filesRepo.uploadKnowledgeFile(supabase, {
    documentId: documentId || null,
    file,
    uploadedBy: profile.id,
  });

  revalidatePath("/base-conhecimento/arquivos");
  if (documentId) revalidatePath(`/base-conhecimento/documentos/${documentId}`);
  return { status: "success", message: "Arquivo enviado.", file: uploaded };
}

export async function getKnowledgeFileDownloadUrlAction(
  fileId: string,
): Promise<{ url: string | null; error?: string }> {
  const profile = await requireCrmProfile();
  try {
    const supabase = await getSupabaseAuthClient();
    const file = await filesRepo.getFileById(supabase, fileId);
    if (!file) return { url: null, error: "Arquivo não encontrado." };

    const url = await filesRepo.getFileSignedUrl(supabase, file.storagePath, 60);
    // crm_knowledge_views.document_id is a required FK — a standalone file
    // (uploaded straight to the Biblioteca de Arquivos, not attached to a
    // document) has no document to log the download against, so it's
    // simply not logged rather than pointing the FK at a fake id.
    if (!(await isDemoModeActive()) && file.documentId) {
      await viewsRepo.recordView(supabase, {
        documentId: file.documentId,
        userId: profile.id,
        action: "download",
        fileId,
      });
    }
    return { url };
  } catch (err) {
    return { url: null, error: err instanceof Error ? err.message : "Falha ao gerar link." };
  }
}

export async function deleteKnowledgeFileAction(
  fileId: string,
  storagePath: string,
  documentId: string | null,
): Promise<{ ok: boolean; error?: string }> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return { ok: false, error: DEMO_WRITE_BLOCKED_MESSAGE };

  const supabase = await getSupabaseAuthClient();
  await filesRepo.deleteKnowledgeFile(supabase, fileId, storagePath);

  revalidatePath("/base-conhecimento/arquivos");
  if (documentId) revalidatePath(`/base-conhecimento/documentos/${documentId}`);
  return { ok: true };
}
