"use server";

import {
  getProjectFileSignedUrl,
  uploadProjectFile,
} from "@/repositories/projects/projectFilesRepository";
import { getProjectById } from "@/repositories/projects/projectsRepository";
import { requirePortalAccess } from "@/services/clientPortal/portalAccessService";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";

const DEMO_WRITE_BLOCKED_MESSAGE =
  "Ação indisponível em Modo Demonstração — nenhuma escrita é enviada ao banco.";

const MAX_PORTAL_FILE_SIZE_BYTES = 15 * 1024 * 1024;

export interface PortalFileActionState {
  status: "idle" | "success" | "error";
  message?: string;
}

/** Upload is gated twice: here (clear Portuguese error, no wasted round
 * trip) and again by the "Portal cliente envia crm_project_files" /
 * storage.objects RLS policies (can_upload_files must be true) — the real
 * enforcement is the database policy, this is just the friendly UX layer. */
export async function uploadPortalFileAction(
  _prevState: PortalFileActionState,
  formData: FormData,
): Promise<PortalFileActionState> {
  const access = await requirePortalAccess();
  if (await isDemoModeActive()) return { status: "error", message: DEMO_WRITE_BLOCKED_MESSAGE };

  if (!access.canUploadFiles) {
    return { status: "error", message: "Envio de arquivos não habilitado para este acesso." };
  }

  const projectId = String(formData.get("projectId") ?? "").trim();
  const file = formData.get("file");
  if (!projectId || !(file instanceof File) || file.size === 0) {
    return { status: "error", message: "Selecione um arquivo." };
  }
  if (file.size > MAX_PORTAL_FILE_SIZE_BYTES) {
    return { status: "error", message: "Arquivo maior que 15MB." };
  }

  const supabase = await getSupabaseAuthClient();
  const project = await getProjectById(supabase, projectId);
  if (!project || project.clientId !== access.clientId) {
    return { status: "error", message: "Projeto não encontrado." };
  }

  const { data } = await supabase.auth.getUser();
  const uploadedBy = data.user?.id;
  if (!uploadedBy) return { status: "error", message: "Sessão expirada." };

  await uploadProjectFile(supabase, { projectId, taskId: null, file, uploadedBy });
  return { status: "success", message: "Arquivo enviado." };
}

export async function getPortalFileDownloadUrlAction(
  storagePath: string,
): Promise<{ url: string | null; error?: string }> {
  await requirePortalAccess();
  try {
    const supabase = await getSupabaseAuthClient();
    const url = await getProjectFileSignedUrl(supabase, storagePath, 60);
    return { url };
  } catch (err) {
    return { url: null, error: err instanceof Error ? err.message : "Falha ao gerar link." };
  }
}
