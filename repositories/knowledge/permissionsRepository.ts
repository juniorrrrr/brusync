import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { KnowledgePermission } from "@/types/knowledge";

interface PermissionRow {
  id: string;
  document_id: string | null;
  category_id: string | null;
  profile_id: string | null;
  role: string | null;
  can_view: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_publish: boolean;
  can_approve: boolean;
  can_duplicate: boolean;
  can_favorite: boolean;
  profile?: { name: string | null; email: string | null } | null;
}

const PERMISSION_SELECT = `
  id, document_id, category_id, profile_id, role,
  can_view, can_edit, can_delete, can_publish, can_approve, can_duplicate, can_favorite,
  profile:profiles!crm_knowledge_permissions_profile_id_fkey (name, email)
`;

function mapPermission(row: PermissionRow): KnowledgePermission {
  return {
    id: row.id,
    documentId: row.document_id,
    categoryId: row.category_id,
    profileId: row.profile_id,
    profileName: row.profile?.name ?? row.profile?.email ?? null,
    role: row.role,
    canView: row.can_view,
    canEdit: row.can_edit,
    canDelete: row.can_delete,
    canPublish: row.can_publish,
    canApprove: row.can_approve,
    canDuplicate: row.can_duplicate,
    canFavorite: row.can_favorite,
  };
}

/** All override rows relevant to resolving a single document's effective
 * permissions: ones targeting the document itself and ones targeting its
 * category — knowledgePermissionService merges these with role defaults. */
export async function listPermissionsForDocument(
  supabase: SupabaseClient,
  documentId: string,
  categoryId: string | null,
): Promise<KnowledgePermission[]> {
  let query = supabase.from("crm_knowledge_permissions").select(PERMISSION_SELECT);
  query = categoryId
    ? query.or(`document_id.eq.${documentId},category_id.eq.${categoryId}`)
    : query.eq("document_id", documentId);

  const { data, error } = await query;
  if (error) throw new Error(`Falha ao carregar permissões: ${error.message}`);
  return ((data ?? []) as unknown as PermissionRow[]).map(mapPermission);
}

export async function listPermissionsForTarget(
  supabase: SupabaseClient,
  target: { documentId?: string; categoryId?: string },
): Promise<KnowledgePermission[]> {
  let query = supabase.from("crm_knowledge_permissions").select(PERMISSION_SELECT);
  if (target.documentId) query = query.eq("document_id", target.documentId);
  if (target.categoryId) query = query.eq("category_id", target.categoryId);

  const { data, error } = await query;
  if (error) throw new Error(`Falha ao carregar permissões: ${error.message}`);
  return ((data ?? []) as unknown as PermissionRow[]).map(mapPermission);
}

export interface UpsertPermissionPayload {
  documentId: string | null;
  categoryId: string | null;
  profileId: string | null;
  role: string | null;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canPublish: boolean;
  canApprove: boolean;
  canDuplicate: boolean;
  canFavorite: boolean;
  grantedBy: string | null;
}

export async function createPermission(
  supabase: SupabaseClient,
  payload: UpsertPermissionPayload,
): Promise<{ id: string }> {
  const { data, error } = await supabase
    .from("crm_knowledge_permissions")
    .insert({
      document_id: payload.documentId,
      category_id: payload.categoryId,
      profile_id: payload.profileId,
      role: payload.role,
      can_view: payload.canView,
      can_edit: payload.canEdit,
      can_delete: payload.canDelete,
      can_publish: payload.canPublish,
      can_approve: payload.canApprove,
      can_duplicate: payload.canDuplicate,
      can_favorite: payload.canFavorite,
      granted_by: payload.grantedBy,
    })
    .select("id")
    .single();

  if (error) throw new Error(`Falha ao criar permissão: ${error.message}`);
  return data as { id: string };
}

export async function deletePermission(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("crm_knowledge_permissions").delete().eq("id", id);
  if (error) throw new Error(`Falha ao remover permissão: ${error.message}`);
}
