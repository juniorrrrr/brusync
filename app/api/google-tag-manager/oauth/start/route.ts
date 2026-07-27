import { NextResponse } from "next/server";
import { getCurrentUser } from "@/services/auth/session";
import {
  buildGtmAuthorizeUrl,
  createGtmOAuthState,
} from "@/services/googleTagManager/gtmOAuthService";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  const state = await createGtmOAuthState();
  const redirectUri = new URL("/api/google-tag-manager/oauth/callback", request.url).toString();
  const authorizeUrl = buildGtmAuthorizeUrl(redirectUri, state);

  return NextResponse.redirect(authorizeUrl);
}
