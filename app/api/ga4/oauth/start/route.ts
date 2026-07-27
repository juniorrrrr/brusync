import { NextResponse } from "next/server";
import { getCurrentUser } from "@/services/auth/session";
import { buildGa4AuthorizeUrl, createGa4OAuthState } from "@/services/ga4/ga4OAuthService";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  const state = await createGa4OAuthState();
  const redirectUri = new URL("/api/ga4/oauth/callback", request.url).toString();
  const authorizeUrl = buildGa4AuthorizeUrl(redirectUri, state);

  return NextResponse.redirect(authorizeUrl);
}
