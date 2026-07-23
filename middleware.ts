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

/** Protects the Brusync OS (CRM) routes and the Portal do Cliente routes —
 * the `matcher` below never touches the public site, so this can't affect
 * the landing page, cases, blog, or materiais even if something here
 * misbehaves. */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPortalPath = pathname === "/portal" || pathname.startsWith("/portal/");
  const isPublicPortalPath = PUBLIC_PORTAL_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
  const isPublicCrmPath =
    !isPortalPath &&
    PUBLIC_CRM_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  const { supabase, response } = getSupabaseMiddlewareClient(request);

  if (!supabase) {
    // Supabase Auth env vars missing — fail closed on protected routes
    // rather than crash the whole request; never touch /login or
    // /portal/login themselves (that would create a redirect loop).
    if (!isPublicCrmPath && !isPublicPortalPath) {
      return NextResponse.redirect(new URL(isPortalPath ? "/portal/login" : "/login", request.url));
    }
    return response;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

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
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
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
    "/portal",
    "/portal/:path*",
  ],
};
