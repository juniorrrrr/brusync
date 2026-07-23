import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createPortalUserLink } from "@/repositories/clientPortal/portalAccessRepository";
import { getSupabaseServerClient } from "@/services/supabase/server";

function generateTemporaryPassword(): string {
  // 12 random bytes, base64url-encoded — never persisted or logged, only
  // ever returned once to the calling staff member to relay out-of-band.
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return `${btoa(String.fromCharCode(...bytes))
    .replace(/[+/=]/g, "")
    .slice(0, 16)}Aa1!`;
}

/** Grants a client portal access: creates the auth.users row (service role
 * — auth.admin.* only works with it), which the existing handle_new_user()
 * trigger turns into a profiles row (role="cliente" by default, untouched),
 * then links that profile to the client via the RLS-gated client so
 * is_internal_staff() governs the write like everywhere else. Returns the
 * generated password once — the staff member relays it to the client
 * themselves; nothing here emails it or stores it in plaintext. */
export async function grantPortalAccess(
  supabase: SupabaseClient,
  params: {
    clientId: string;
    email: string;
    name: string;
    canUploadFiles: boolean;
    createdBy: string | null;
  },
): Promise<{ email: string; temporaryPassword: string }> {
  const admin = getSupabaseServerClient();
  const temporaryPassword = generateTemporaryPassword();

  const { data, error } = await admin.auth.admin.createUser({
    email: params.email,
    password: temporaryPassword,
    email_confirm: true,
  });

  if (error || !data.user) {
    throw new Error(`Falha ao criar acesso do cliente: ${error?.message ?? "erro desconhecido"}`);
  }

  try {
    await createPortalUserLink(supabase, {
      profileId: data.user.id,
      clientId: params.clientId,
      name: params.name || null,
      canUploadFiles: params.canUploadFiles,
      createdBy: params.createdBy,
    });
  } catch (linkError) {
    // Roll back the auth user so a failed link doesn't leave an orphaned,
    // unusable account behind.
    await admin.auth.admin.deleteUser(data.user.id);
    throw linkError;
  }

  return { email: params.email, temporaryPassword };
}
