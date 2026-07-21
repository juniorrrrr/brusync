import "server-only";

import { getCurrentProfile, type Profile } from "@/services/auth/session";

/** Defense-in-depth check for Server Actions: middleware already blocks
 * unauthenticated requests to every /(crm)/(app) route, but a Server Action
 * can in principle be invoked directly, so every mutation re-checks the
 * session before touching the database. */
export async function requireCrmProfile(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Não autenticado.");
  return profile;
}
