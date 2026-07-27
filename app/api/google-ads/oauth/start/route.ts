import { NextResponse } from "next/server";
import { getCurrentUser } from "@/services/auth/session";
import {
  buildGoogleAdsAuthorizeUrl,
  createGoogleAdsOAuthState,
} from "@/services/googleAds/googleAdsOAuthService";

export const dynamic = "force-dynamic";

/** Ponto de entrada do "Conectar" do card Google Ads na Central de
 * Integrações — sem página própria (Fase 35 proíbe criar uma), então o
 * botão do Drawer/GoogleEntityPicker linka direto para cá. Mesmo padrão de
 * app/api/meta-ads/oauth/start/route.ts. */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  const state = await createGoogleAdsOAuthState();
  const redirectUri = new URL("/api/google-ads/oauth/callback", request.url).toString();
  const authorizeUrl = buildGoogleAdsAuthorizeUrl(redirectUri, state);

  return NextResponse.redirect(authorizeUrl);
}
