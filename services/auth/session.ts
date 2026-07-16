import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";

export interface Profile {
  id: string;
  name: string | null;
  email: string | null;
  role: "administrador" | "gestor" | "comercial" | "atendimento" | "cliente";
}

/** Returns the current session's user, or null if not signed in. Cheap to
 * call from any Server Component — the session cookie is already resolved
 * by middleware on every request. Wrapped in React's `cache()` so multiple
 * calls within the same request/render (e.g. requireUser() followed by
 * getCurrentProfile()) share a single supabase.auth.getUser() round trip
 * instead of hitting Supabase Auth twice. */
export const getCurrentUser = cache(async () => {
  const supabase = await getSupabaseAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/** Fetches the signed-in user's profile row (name, role). Returns null if
 * there's no session or the profile hasn't been created yet. */
export async function getCurrentProfile(): Promise<Profile | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await getSupabaseAuthClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, name, email, role")
    .eq("id", user.id)
    .single();

  return (data as Profile) ?? null;
}

/** Guard for protected layouts/pages: redirects to /login when there's no
 * session. Middleware already does this at the edge — this is the
 * defense-in-depth check at the Server Component level, so a page never
 * renders without a confirmed user even if middleware is ever bypassed
 * (e.g. a direct RSC fetch). */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
