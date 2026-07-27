import { NextResponse } from "next/server";
import { getCurrentUser } from "@/services/auth/session";
import {
  buildSearchConsoleAuthorizeUrl,
  createSearchConsoleOAuthState,
} from "@/services/searchConsole/searchConsoleOAuthService";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  const state = await createSearchConsoleOAuthState();
  const redirectUri = new URL("/api/search-console/oauth/callback", request.url).toString();
  const authorizeUrl = buildSearchConsoleAuthorizeUrl(redirectUri, state);

  return NextResponse.redirect(authorizeUrl);
}
