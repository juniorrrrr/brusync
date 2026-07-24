"use server";

import { revalidatePath } from "next/cache";
import { requireCrmProfile } from "@/application/crm/authGuard";
import { isDemoModeActive } from "@/services/demo/demoMode";
import * as permissionService from "@/services/knowledge/knowledgePermissionService";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type { KnowledgeEffectivePermissions, KnowledgePermission } from "@/types/knowledge";

const DEMO_WRITE_BLOCKED_MESSAGE =
  "Ação indisponível em Modo Demonstração — nenhuma escrita é enviada ao banco.";

export async function fetchKnowledgeEffectivePermissions(
  documentId: string,
  categoryId: string | null,
  createdBy: string | null,
): Promise<KnowledgeEffectivePermissions> {
  const profile = await requireCrmProfile();
  if (await isDemoModeActive()) {
    return permissionService.resolveOwnerAwareDefaults(profile.role, createdBy === profile.id);
  }

  const supabase = await getSupabaseAuthClient();
  return permissionService.resolveEffectivePermissions(supabase, {
    documentId,
    categoryId,
    createdBy,
    profileId: profile.id,
    role: profile.role,
  });
}

export async function fetchKnowledgePermissionsForTarget(target: {
  documentId?: string;
  categoryId?: string;
}): Promise<KnowledgePermission[]> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return [];

  const supabase = await getSupabaseAuthClient();
  return permissionService.listPermissionsForTarget(supabase, target);
}

export async function grantKnowledgePermissionAction(
  input: permissionService.GrantPermissionInput,
): Promise<{ ok: boolean; error?: string }> {
  const profile = await requireCrmProfile();
  if (await isDemoModeActive()) return { ok: false, error: DEMO_WRITE_BLOCKED_MESSAGE };
  if (profile.role !== "administrador" && profile.role !== "gestor") {
    return { ok: false, error: "Apenas administradores e gestores concedem permissões." };
  }

  const supabase = await getSupabaseAuthClient();
  await permissionService.grantPermission(supabase, input, profile.id);

  revalidatePath("/base-conhecimento");
  return { ok: true };
}

export async function revokeKnowledgePermissionAction(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  const profile = await requireCrmProfile();
  if (await isDemoModeActive()) return { ok: false, error: DEMO_WRITE_BLOCKED_MESSAGE };
  if (profile.role !== "administrador" && profile.role !== "gestor") {
    return { ok: false, error: "Apenas administradores e gestores revogam permissões." };
  }

  const supabase = await getSupabaseAuthClient();
  await permissionService.revokePermission(supabase, id);

  revalidatePath("/base-conhecimento");
  return { ok: true };
}
