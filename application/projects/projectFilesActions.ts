"use server";

import { revalidatePath } from "next/cache";
import { requireCrmProfile } from "@/application/crm/authGuard";
import {
  deleteProjectFile,
  getProjectFileSignedUrl,
  listFilesForProject,
  uploadProjectFile,
} from "@/repositories/projects/projectFilesRepository";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type { ProjectFile } from "@/types/projects";

const DEMO_WRITE_BLOCKED_MESSAGE =
  "Ação indisponível em Modo Demonstração — nenhuma escrita é enviada ao banco.";

const MAX_PROJECT_FILE_SIZE_BYTES = 15 * 1024 * 1024;

function validateProjectFile(file: File): string | null {
  if (file.size > MAX_PROJECT_FILE_SIZE_BYTES) return "Arquivo maior que 15MB.";
  return null;
}

export interface FileActionState {
  status: "idle" | "success" | "error";
  message?: string;
}

export async function fetchProjectFiles(projectId: string): Promise<ProjectFile[]> {
  await requireCrmProfile();
  const supabase = await getSupabaseAuthClient();
  return listFilesForProject(supabase, projectId);
}

export async function uploadProjectFileAction(
  _prevState: FileActionState,
  formData: FormData,
): Promise<FileActionState> {
  const profile = await requireCrmProfile();
  if (await isDemoModeActive()) return { status: "error", message: DEMO_WRITE_BLOCKED_MESSAGE };

  const projectId = String(formData.get("projectId") ?? "").trim();
  const taskId = String(formData.get("taskId") ?? "").trim();
  const file = formData.get("file");

  if (!projectId || !(file instanceof File) || file.size === 0) {
    return { status: "error", message: "Selecione um arquivo." };
  }

  const validationError = validateProjectFile(file);
  if (validationError) return { status: "error", message: validationError };

  const supabase = await getSupabaseAuthClient();
  await uploadProjectFile(supabase, {
    projectId,
    taskId: taskId || null,
    file,
    uploadedBy: profile.id,
  });

  revalidatePath("/projetos");
  return { status: "success", message: "Arquivo enviado." };
}

export async function deleteProjectFileAction(
  fileId: string,
  storagePath: string,
): Promise<{ ok: boolean; error?: string }> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return { ok: false, error: DEMO_WRITE_BLOCKED_MESSAGE };

  const supabase = await getSupabaseAuthClient();
  await deleteProjectFile(supabase, fileId, storagePath);

  revalidatePath("/projetos");
  return { ok: true };
}

export async function getProjectFileDownloadUrlAction(
  storagePath: string,
): Promise<{ url: string | null; error?: string }> {
  await requireCrmProfile();
  try {
    const supabase = await getSupabaseAuthClient();
    const url = await getProjectFileSignedUrl(supabase, storagePath, 60);
    return { url };
  } catch (err) {
    return { url: null, error: err instanceof Error ? err.message : "Falha ao gerar link." };
  }
}
