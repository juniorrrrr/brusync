import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { DEMO_MODE_COOKIE } from "@/lib/demo/constants";

/** Demo Mode safety net: every repository/action gets its Supabase client
 * through this one function, so wrapping it here is the single choke point
 * that guarantees "não gravar nada no Supabase" even for write paths the
 * demo-data layer doesn't explicitly intercept (e.g. dragging a demo card,
 * submitting a form while Demo Mode is on). insert/update/upsert/delete are
 * short-circuited into a Postgrest-shaped error *before* any network call;
 * reads (select) pass through untouched — the actual fictitious content for
 * every screen covered by Demo Mode comes from the higher-level query
 * functions (application/crm, application/marketingAnalytics) never calling
 * this client at all while Demo Mode is on, not from blocking reads here. */
const DEMO_WRITE_BLOCKED_ERROR = {
  message: "Ação bloqueada: Modo Demonstração ativo — nenhuma escrita é enviada ao banco.",
  details: null,
  hint: null,
  code: "DEMO_MODE_BLOCKED",
};

const BLOCKED_WRITE_METHODS = new Set(["insert", "update", "upsert", "delete"]);

function createBlockedThenable(): unknown {
  const handler: ProxyHandler<Record<string, unknown>> = {
    get(_target, prop) {
      if (prop === "then") {
        return (resolve: (value: unknown) => void) =>
          resolve({ data: null, error: DEMO_WRITE_BLOCKED_ERROR, count: null, status: 403 });
      }
      if (prop === "catch" || prop === "finally") return undefined;
      // Any other property access (select/eq/single/order/...) returns a
      // callable that keeps returning this same proxy, so arbitrary
      // post-write chaining never throws — it just stays "blocked".
      return (..._args: unknown[]) => proxy;
    },
  };
  const proxy = new Proxy({}, handler);
  return proxy;
}

function wrapQueryBuilderForDemoMode<T extends object>(builder: T): T {
  return new Proxy(builder, {
    get(target, prop, receiver) {
      if (typeof prop === "string" && BLOCKED_WRITE_METHODS.has(prop)) {
        return (..._args: unknown[]) => createBlockedThenable();
      }
      const value = Reflect.get(target, prop, receiver);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
}

function wrapClientForDemoMode<T extends { from: (table: string) => object }>(client: T): T {
  return new Proxy(client, {
    get(target, prop, receiver) {
      if (prop === "from") {
        return (table: string) => wrapQueryBuilderForDemoMode(target.from(table));
      }
      const value = Reflect.get(target, prop, receiver);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
}

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

  const client = createServerClient(url, anonKey, {
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

  if (cookieStore.get(DEMO_MODE_COOKIE)?.value === "1") {
    return wrapClientForDemoMode(client);
  }
  return client;
}
