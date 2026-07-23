import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { PortalAccess } from "@/types/clientPortal";

interface PortalAccessRow {
  client_id: string;
  can_upload_files: boolean;
  client: { company: string } | null;
}

const PORTAL_ACCESS_SELECT = `
  client_id, can_upload_files,
  client:clients!crm_client_portal_users_client_id_fkey (company)
`;

/** RLS already restricts this to the signed-in user's own row (policy
 * "Portal cliente lê o próprio acesso") — no profile_id filter needed here,
 * there is only ever one row a portal user can see. */
export async function getPortalAccessForCurrentUser(
  supabase: SupabaseClient,
): Promise<PortalAccess | null> {
  const { data, error } = await supabase
    .from("crm_client_portal_users")
    .select(PORTAL_ACCESS_SELECT)
    .maybeSingle();

  if (error) throw new Error(`Falha ao carregar acesso ao portal: ${error.message}`);
  if (!data) return null;

  const row = data as unknown as PortalAccessRow;
  if (!row.client) return null;

  return {
    clientId: row.client_id,
    clientCompany: row.client.company,
    canUploadFiles: row.can_upload_files,
  };
}

export interface PortalUserRow {
  id: string;
  profileId: string;
  clientId: string;
  name: string | null;
  email: string | null;
  canUploadFiles: boolean;
  createdAt: string;
}

interface RawPortalUserRow {
  id: string;
  profile_id: string;
  client_id: string;
  name: string | null;
  can_upload_files: boolean;
  created_at: string;
  profile: { email: string | null } | null;
}

const PORTAL_USER_SELECT = `
  id, profile_id, client_id, name, can_upload_files, created_at,
  profile:profiles!crm_client_portal_users_profile_id_fkey (email)
`;

/** Staff-facing list, used by the Cliente drawer's "Portal do Cliente"
 * section — is_internal_staff() gates this via RLS. */
export async function listPortalUsersForClient(
  supabase: SupabaseClient,
  clientId: string,
): Promise<PortalUserRow[]> {
  const { data, error } = await supabase
    .from("crm_client_portal_users")
    .select(PORTAL_USER_SELECT)
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Falha ao carregar acessos do portal: ${error.message}`);

  return ((data ?? []) as unknown as RawPortalUserRow[]).map((row) => ({
    id: row.id,
    profileId: row.profile_id,
    clientId: row.client_id,
    name: row.name,
    email: row.profile?.email ?? null,
    canUploadFiles: row.can_upload_files,
    createdAt: row.created_at,
  }));
}

export async function createPortalUserLink(
  supabase: SupabaseClient,
  params: {
    profileId: string;
    clientId: string;
    name: string | null;
    canUploadFiles: boolean;
    createdBy: string | null;
  },
): Promise<void> {
  const { error } = await supabase.from("crm_client_portal_users").insert({
    profile_id: params.profileId,
    client_id: params.clientId,
    name: params.name,
    can_upload_files: params.canUploadFiles,
    created_by: params.createdBy,
  });
  if (error) throw new Error(`Falha ao conceder acesso ao portal: ${error.message}`);
}

export async function updatePortalUserPermission(
  supabase: SupabaseClient,
  id: string,
  canUploadFiles: boolean,
): Promise<void> {
  const { error } = await supabase
    .from("crm_client_portal_users")
    .update({ can_upload_files: canUploadFiles })
    .eq("id", id);
  if (error) throw new Error(`Falha ao atualizar permissão do portal: ${error.message}`);
}

export async function deletePortalUserLink(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("crm_client_portal_users").delete().eq("id", id);
  if (error) throw new Error(`Falha ao revogar acesso ao portal: ${error.message}`);
}
