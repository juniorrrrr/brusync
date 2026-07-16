import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

/** Cookie-bound Supabase client for use inside middleware.ts. Reads/writes
 * cookies on the request AND the response, so a refreshed session token is
 * persisted for the rest of the request lifecycle — the pattern Supabase's
 * own Next.js SSR guide documents for middleware specifically (distinct
 * from the Server Component/Action client in services/supabase/authServer.ts). */
export function getSupabaseMiddlewareClient(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return { supabase: null, response };
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  return { supabase, response };
}
