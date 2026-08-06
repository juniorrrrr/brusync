import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseMiddlewareClient } from "@/services/supabase/authMiddleware";

const PUBLIC_CRM_PATHS = ["/login"];

/** The portal (Fase 13) shares this same Supabase Auth pool but is a
 * separate audience — a portal path only ever needs "is there a session at
 * all" here; which role that session belongs to (and whether it's actually
 * a valid portal user) is checked at the layout/Server Action level
 * (services/clientPortal/portalAccessService.ts), same defense-in-depth
 * split the CRM side already uses. Deliberately NOT applying the CRM's
 * "authenticated + public path → redirect away" rule to /portal/login: an
 * internal staff session (or a cliente-role session with no company linked
 * yet) must still be able to load that page without bouncing in a loop. */
const PUBLIC_PORTAL_PATHS = ["/portal/login"];

/** supabase.auth.getUser() makes a network call to the Supabase Auth API on
 * every single request to a protected route. With no bound on that call, a
 * slow or unreachable Auth API hangs the proxy until Vercel's platform
 * timeout kills it, surfacing as a site-wide 504 MIDDLEWARE_INVOCATION_TIMEOUT
 * — since the matcher below covers nearly every route in the app. Racing it
 * against a timeout turns that outage into a fast, safe redirect instead. */
const AUTH_TIMEOUT_MS = 5000;

/** Protects the Brusync OS (CRM) routes and the Portal do Cliente routes —
 * the `matcher` below never touches the public site, so this can't affect
 * the landing page, cases, blog, or materiais even if something here
 * misbehaves. */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPortalPath = pathname === "/portal" || pathname.startsWith("/portal/");
  const isPublicPortalPath = PUBLIC_PORTAL_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
  const isPublicCrmPath =
    !isPortalPath &&
    PUBLIC_CRM_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  const { supabase, response } = getSupabaseMiddlewareClient(request);

  const failClosed = () => {
    // Fail closed on protected routes rather than hang/crash the whole
    // request; never touch /login or /portal/login themselves (that would
    // create a redirect loop).
    if (!isPublicCrmPath && !isPublicPortalPath) {
      return NextResponse.redirect(new URL(isPortalPath ? "/portal/login" : "/login", request.url));
    }
    return response;
  };

  if (!supabase) {
    // Supabase Auth env vars missing.
    return failClosed();
  }

  const timeout = new Promise<"timeout">((resolve) => {
    setTimeout(() => resolve("timeout"), AUTH_TIMEOUT_MS);
  });
  const result = await Promise.race([supabase.auth.getUser(), timeout]);

  if (result === "timeout") {
    console.error(
      `[proxy] supabase.auth.getUser() timed out after ${AUTH_TIMEOUT_MS}ms for ${pathname}`,
    );
    return failClosed();
  }

  const {
    data: { user },
  } = result;

  if (!user && isPortalPath && !isPublicPortalPath) {
    const redirectUrl = new URL("/portal/login", request.url);
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (!user && !isPortalPath && !isPublicCrmPath) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && isPublicCrmPath) {
    return NextResponse.redirect(new URL("/operacoes", request.url));
  }

  return response;
}

export const proxyConfig = {
  matcher: [
    "/login",
    "/dashboard/:path*",
    "/leads/:path*",
    "/pipeline/:path*",
    "/clientes/:path*",
    "/conversoes/:path*",
    "/integracoes/:path*",
    "/configuracoes/:path*",
    "/usuarios/:path*",
    "/agenda/:path*",
    "/automacoes/:path*",
    "/base-conhecimento/:path*",
    "/comunicacao/:path*",
    "/financeiro/:path*",
    "/inteligencia/:path*",
    "/marketing/:path*",
    "/operacoes/:path*",
    "/projetos/:path*",
    "/portal",
    "/portal/:path*",
  ],
};
