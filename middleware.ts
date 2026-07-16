import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseMiddlewareClient } from "@/services/supabase/authMiddleware";

const PUBLIC_CRM_PATHS = ["/login"];

/** Protects the Brusync OS (CRM) routes only — the `matcher` below never
 * touches the public site, so this can't affect the landing page, cases,
 * blog, or materiais even if something here misbehaves. */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublicCrmPath = PUBLIC_CRM_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  const { supabase, response } = getSupabaseMiddlewareClient(request);

  if (!supabase) {
    // Supabase Auth env vars missing — fail closed on protected routes
    // rather than crash the whole request; never touch /login itself
    // (that would create a redirect loop).
    if (!isPublicCrmPath) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return response;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isPublicCrmPath) {
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
    "/lead/:path*",
    "/configuracoes/:path*",
    "/usuarios/:path*",
  ],
};
