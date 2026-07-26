"use server";

import { revalidatePath } from "next/cache";
import { requireCrmProfile } from "@/application/crm/authGuard";
import { validateDocumentFile } from "@/schemas/shared/fileValidation";
import { isDemoModeActive } from "@/services/demo/demoMode";
import {
  attachDocumentRecord,
  deleteProcessFileRecord,
  detachDocumentRecord,
  getProcessFileUrl,
  uploadProcessFileRecord,
} from "@/services/processes/processesService";
import type { ProcessFile } from "@/types/processes";

const DEMO_WRITE_BLOCKED_MESSAGE =
  "Ação indisponível em Modo Demonstração — nenhuma escrita é enviada ao banco.";
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

export async function attachProcessDocumentAction(
  processId: string,
  documentId: string,
  documentTitle: string,
): Promise<{ ok: boolean; error?: string }> {
  const profile = await requireCrmProfile();
  if (await isDemoModeActive()) return { ok: false, error: DEMO_WRITE_BLOCKED_MESSAGE };

  await attachDocumentRecord(processId, documentId, documentTitle, profile.id);
  revalidatePath(`/processos/${processId}`);
  return { ok: true };
}

export async function detachProcessDocumentAction(
  processId: string,
  documentId: string,
): Promise<{ ok: boolean; error?: string }> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return { ok: false, error: DEMO_WRITE_BLOCKED_MESSAGE };

  await detachDocumentRecord(processId, documentId);
  revalidatePath(`/processos/${processId}`);
  return { ok: true };
}

export interface ProcessFileActionState {
  status: "idle" | "success" | "error";
  message?: string;
  file?: ProcessFile;
}

export async function uploadProcessFileAction(
  _prevState: ProcessFileActionState,
  formData: FormData,
): Promise<ProcessFileActionState> {
  const profile = await requireCrmProfile();
  if (await isDemoModeActive()) return { status: "error", message: DEMO_WRITE_BLOCKED_MESSAGE };

  const processId = String(formData.get("processId") ?? "").trim();
  const file = formData.get("file");
  if (!processId) return { status: "error", message: "Processo não encontrado." };
  if (!(file instanceof File) || file.size === 0) {
    return { status: "error", message: "Selecione um arquivo." };
  }
  const validationError = validateDocumentFile(file, MAX_FILE_SIZE_BYTES);
  if (validationError) return { status: "error", message: validationError };

  const uploaded = await uploadProcessFileRecord({ processId, file, uploadedBy: profile.id });
  revalidatePath(`/processos/${processId}`);
  return { status: "success", message: "Arquivo enviado.", file: uploaded };
}

export async function getProcessFileDownloadUrlAction(
  storagePath: string,
): Promise<{ url: string | null; error?: string }> {
  await requireCrmProfile();
  try {
    const url = await getProcessFileUrl(storagePath);
    return { url };
  } catch (err) {
    return { url: null, error: err instanceof Error ? err.message : "Falha ao gerar link." };
  }
}

export async function deleteProcessFileAction(
  fileId: string,
  storagePath: string,
  processId: string,
): Promise<{ ok: boolean; error?: string }> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return { ok: false, error: DEMO_WRITE_BLOCKED_MESSAGE };

  await deleteProcessFileRecord(fileId, storagePath);
  revalidatePath(`/processos/${processId}`);
  return { ok: true };
}
