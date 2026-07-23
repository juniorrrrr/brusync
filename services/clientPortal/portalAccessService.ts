import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";
import { getPortalAccessForCurrentUser } from "@/repositories/clientPortal/portalAccessRepository";
import { getCurrentProfile, getCurrentUser } from "@/services/auth/session";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type { PortalAccess } from "@/types/clientPortal";

/** Resolves the signed-in portal user's own access record, or null if
 * there's no session, the profile isn't role="cliente", or there's no
 * crm_client_portal_users row linking them to a company yet. Mirrors
 * services/auth/session.ts's getCurrentProfile() — cache()-wrapped so the
 * portal layout guard and a page's own data fetch share one round trip. */
export const getCurrentPortalAccess = cache(async (): Promise<PortalAccess | null> => {
  const user = await getCurrentUser();
  if (!user) return null;

  const profile = await getCurrentProfile();
  if (profile?.role !== "cliente") return null;

  const supabase = await getSupabaseAuthClient();
  return getPortalAccessForCurrentUser(supabase);
});

/** Guard for the portal's protected layout — redirects to /portal/login when
 * there's no valid portal session. Same defense-in-depth reasoning as
 * requireUser() for the internal CRM: middleware already gates /portal/*,
 * this re-checks at the Server Component level. */
export async function requirePortalAccess(): Promise<PortalAccess> {
  const access = await getCurrentPortalAccess();
  if (!access) redirect("/portal/login");
  return access;
}
