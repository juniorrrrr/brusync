import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** Cookie-bound Supabase client for Server Components and Server Actions —
 * uses the anon key (safe to expose; RLS policies protect the data) plus
 * the visitor's own session cookie, so it only ever sees what that user is
 * allowed to see. This is a different client from
 * services/supabase/server.ts (service role, bypasses RLS, used only for
 * the public site's lead-capture inserts) — never mix the two. */
export async function getSupabaseAuthClient() {
  const cookieStore = await cookies();
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase Auth não configurado: defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component render (cookies are read-only
          // there) — safe to ignore since middleware refreshes the session
          // on every request anyway.
        }
      },
    },
  });
}
