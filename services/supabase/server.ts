import "server-only";

import { createClient } from "@supabase/supabase-js";

/** Server-only Supabase client using the service role key — never import this
 * from a Client Component or expose the key via NEXT_PUBLIC_*. */
export function getSupabaseServerClient() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY não configuradas. Preencha .env.local a partir de .env.example.",
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}
