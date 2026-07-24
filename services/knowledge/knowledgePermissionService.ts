import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import * as permissionsRepo from "@/repositories/knowledge/permissionsRepository";
import type { KnowledgeEffectivePermissions, KnowledgePermission } from "@/types/knowledge";

export type ProfileRole = "administrador" | "gestor" | "comercial" | "atendimento" | "cliente";

/** Role defaults + the "authors keep edit rights over their own drafts"
 * rule, with no DB access — the only path usable in Modo Demonstração,
 * where crm_knowledge_permissions is never queried. administrador/gestor
 * manage everything; comercial/atendimento consume the library and can
 * duplicate/favorite but need an explicit grant (or authorship) to edit,
 * publish, delete or approve — same "role gates the default, overrides are
 * the exception" model used everywhere else (is_internal_staff gates RLS,
 * application code narrows further). */
export function resolveOwnerAwareDefaults(
  role: ProfileRole,
  isOwner: boolean,
): KnowledgeEffectivePermissions {
  const base = roleDefaults(role);
  return isOwner ? { ...base, canEdit: true } : base;
}

function roleDefaults(role: ProfileRole): KnowledgeEffectivePermissions {
  if (role === "administrador" || role === "gestor") {
    return {
      canView: true,
      canEdit: true,
      canDelete: true,
      canPublish: true,
      canApprove: true,
      canDuplicate: true,
      canFavorite: true,
    };
  }
  return {
    canView: true,
    canEdit: false,
    canDelete: false,
    canPublish: false,
    canApprove: false,
    canDuplicate: true,
    canFavorite: true,
  };
}

function toEffectivePermissions(override: KnowledgePermission): KnowledgeEffectivePermissions {
  return {
    canView: override.canView,
    canEdit: override.canEdit,
    canDelete: override.canDelete,
    canPublish: override.canPublish,
    canApprove: override.canApprove,
    canDuplicate: override.canDuplicate,
    canFavorite: override.canFavorite,
  };
}

export async function resolveEffectivePermissions(
  supabase: SupabaseClient,
  params: {
    documentId: string;
    categoryId: string | null;
    createdBy: string | null;
    profileId: string;
    role: ProfileRole;
  },
): Promise<KnowledgeEffectivePermissions> {
  let effective = resolveOwnerAwareDefaults(params.role, params.createdBy === params.profileId);

  const overrides = await permissionsRepo.listPermissionsForDocument(
    supabase,
    params.documentId,
    params.categoryId,
  );

  // Precedence, least to most specific: role-at-category, role-at-document,
  // profile-at-category, profile-at-document — the most specific match wins
  // outright (an override fully replaces the role defaults, it doesn't merge).
  const ordered = [
    ...overrides.filter((o) => o.role === params.role && o.categoryId && !o.documentId),
    ...overrides.filter((o) => o.role === params.role && o.documentId),
    ...overrides.filter((o) => o.profileId === params.profileId && o.categoryId && !o.documentId),
    ...overrides.filter((o) => o.profileId === params.profileId && o.documentId),
  ];

  const mostSpecific = ordered.at(-1);
  if (mostSpecific) effective = toEffectivePermissions(mostSpecific);

  return effective;
}

export async function listPermissionsForTarget(
  supabase: SupabaseClient,
  target: { documentId?: string; categoryId?: string },
): Promise<KnowledgePermission[]> {
  return permissionsRepo.listPermissionsForTarget(supabase, target);
}

export interface GrantPermissionInput {
  documentId: string | null;
  categoryId: string | null;
  profileId: string | null;
  role: ProfileRole | null;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canPublish: boolean;
  canApprove: boolean;
  canDuplicate: boolean;
  canFavorite: boolean;
}

export async function grantPermission(
  supabase: SupabaseClient,
  input: GrantPermissionInput,
  grantedBy: string,
): Promise<{ id: string }> {
  return permissionsRepo.createPermission(supabase, { ...input, grantedBy });
}

export async function revokePermission(supabase: SupabaseClient, id: string): Promise<void> {
  await permissionsRepo.deletePermission(supabase, id);
}
