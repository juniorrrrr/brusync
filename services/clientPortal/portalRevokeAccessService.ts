import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { deletePortalUserLink } from "@/repositories/clientPortal/portalAccessRepository";
import { getSupabaseServerClient } from "@/services/supabase/server";

/** Revokes a client's portal access: removes the linking row via the
 * RLS-gated client (is_internal_staff() governs it, same as granting), then
 * deletes the auth.users row itself (service role, admin-only API) so the
 * credential can never be reused — "profiles" cascades on delete. */
export async function revokePortalAccess(
  supabase: SupabaseClient,
  params: { portalUserId: string; profileId: string },
): Promise<void> {
  await deletePortalUserLink(supabase, params.portalUserId);

  const admin = getSupabaseServerClient();
  const { error } = await admin.auth.admin.deleteUser(params.profileId);
  if (error) throw new Error(`Falha ao remover credencial do portal: ${error.message}`);
}
