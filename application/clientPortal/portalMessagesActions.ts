"use server";

import { requireCrmProfile } from "@/application/crm/authGuard";
import {
  createMessage,
  listMessagesForProject,
} from "@/repositories/clientPortal/portalMessagesRepository";
import { getProjectById } from "@/repositories/projects/projectsRepository";
import { requirePortalAccess } from "@/services/clientPortal/portalAccessService";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type { PortalMessage } from "@/types/clientPortal";

const DEMO_WRITE_BLOCKED_MESSAGE =
  "Ação indisponível em Modo Demonstração — nenhuma escrita é enviada ao banco.";

export interface PortalMessageActionState {
  status: "idle" | "success" | "error";
  message?: string;
}

/** Staff-facing fetch for the internal Project drawer's "Mensagens do
 * Cliente" tab (components/projects/ProjectPortalMessagesTab.tsx) — the
 * portal side never needs this separately, since getPortalProjectDetail
 * already bundles the thread into PortalProjectDetail.messages. */
export async function fetchProjectMessagesForStaff(projectId: string): Promise<PortalMessage[]> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return [];

  const supabase = await getSupabaseAuthClient();
  return listMessagesForProject(supabase, projectId);
}

export async function sendClientMessageAction(
  _prevState: PortalMessageActionState,
  formData: FormData,
): Promise<PortalMessageActionState> {
  const access = await requirePortalAccess();
  if (await isDemoModeActive()) return { status: "error", message: DEMO_WRITE_BLOCKED_MESSAGE };

  const projectId = String(formData.get("projectId") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { status: "error", message: "Escreva uma mensagem." };

  const supabase = await getSupabaseAuthClient();
  const project = await getProjectById(supabase, projectId);
  if (!project || project.clientId !== access.clientId) {
    return { status: "error", message: "Projeto não encontrado." };
  }

  const { data } = await supabase.auth.getUser();
  const profileId = data.user?.id;
  if (!profileId) return { status: "error", message: "Sessão expirada." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, email")
    .eq("id", profileId)
    .single();

  await createMessage(supabase, {
    projectId,
    authorType: "cliente",
    authorProfileId: profileId,
    authorName: profile?.name ?? profile?.email ?? "Cliente",
    body,
  });

  return { status: "success" };
}

export async function sendStaffMessageAction(
  _prevState: PortalMessageActionState,
  formData: FormData,
): Promise<PortalMessageActionState> {
  const profile = await requireCrmProfile();
  if (await isDemoModeActive()) return { status: "error", message: DEMO_WRITE_BLOCKED_MESSAGE };

  const projectId = String(formData.get("projectId") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { status: "error", message: "Escreva uma resposta." };

  const supabase = await getSupabaseAuthClient();
  await createMessage(supabase, {
    projectId,
    authorType: "equipe",
    authorProfileId: profile.id,
    authorName: profile.name ?? profile.email ?? "Equipe Brusync",
    body,
  });

  return { status: "success" };
}
