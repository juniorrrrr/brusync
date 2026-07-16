import "server-only";

import { createClient } from "@supabase/supabase-js";

/** Server-only Supabase client using the service role key — never import this
 * from a Client Component or expose the key via NEXT_PUBLIC_*.
 *
 * The URL is read from SUPABASE_URL first, falling back to
 * NEXT_PUBLIC_SUPABASE_URL: the project's Vercel environment provisions the
 * latter (it's also needed if a browser-side Supabase client is ever added),
 * and the URL itself isn't a secret, so reading the public var server-side is
 * safe. SUPABASE_SERVICE_ROLE_KEY has no such fallback — it must never be
 * exposed via a NEXT_PUBLIC_* name. */
export function getSupabaseServerClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase não configurado: defina SUPABASE_URL (ou NEXT_PUBLIC_SUPABASE_URL) e SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}
