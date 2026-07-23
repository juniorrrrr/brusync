"use server";

import { revalidatePath } from "next/cache";
import { requireCrmProfile } from "@/application/crm/authGuard";
import {
  listPortalUsersForClient,
  type PortalUserRow,
  updatePortalUserPermission,
} from "@/repositories/clientPortal/portalAccessRepository";
import { grantPortalAccess } from "@/services/clientPortal/portalGrantAccessService";
import { revokePortalAccess } from "@/services/clientPortal/portalRevokeAccessService";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";

const DEMO_WRITE_BLOCKED_MESSAGE =
  "Ação indisponível em Modo Demonstração — nenhuma escrita é enviada ao banco.";

export async function fetchPortalUsersForClient(clientId: string): Promise<PortalUserRow[]> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return [];

  const supabase = await getSupabaseAuthClient();
  return listPortalUsersForClient(supabase, clientId);
}

export interface GrantPortalAccessState {
  status: "idle" | "success" | "error";
  message?: string;
  temporaryPassword?: string;
}

export async function grantPortalAccessAction(
  _prevState: GrantPortalAccessState,
  formData: FormData,
): Promise<GrantPortalAccessState> {
  const profile = await requireCrmProfile();
  if (await isDemoModeActive()) return { status: "error", message: DEMO_WRITE_BLOCKED_MESSAGE };

  const clientId = String(formData.get("clientId") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const canUploadFiles = formData.get("canUploadFiles") === "on";

  if (!clientId || !email) {
    return { status: "error", message: "Informe o e-mail do contato." };
  }

  const supabase = await getSupabaseAuthClient();
  try {
    const { temporaryPassword } = await grantPortalAccess(supabase, {
      clientId,
      email,
      name,
      canUploadFiles,
      createdBy: profile.id,
    });
    revalidatePath("/clientes");
    return {
      status: "success",
      message: "Acesso criado. Repasse a senha abaixo ao cliente por um canal seguro.",
      temporaryPassword,
    };
  } catch (err) {
    return {
      status: "error",
      message: err instanceof Error ? err.message : "Falha ao conceder acesso.",
    };
  }
}

export async function togglePortalUploadPermissionAction(
  portalUserId: string,
  canUploadFiles: boolean,
): Promise<{ ok: boolean; error?: string }> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return { ok: false, error: DEMO_WRITE_BLOCKED_MESSAGE };

  const supabase = await getSupabaseAuthClient();
  await updatePortalUserPermission(supabase, portalUserId, canUploadFiles);
  revalidatePath("/clientes");
  return { ok: true };
}

export async function revokePortalAccessAction(
  portalUserId: string,
  profileId: string,
): Promise<{ ok: boolean; error?: string }> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return { ok: false, error: DEMO_WRITE_BLOCKED_MESSAGE };

  const supabase = await getSupabaseAuthClient();
  await revokePortalAccess(supabase, { portalUserId, profileId });
  revalidatePath("/clientes");
  return { ok: true };
}
