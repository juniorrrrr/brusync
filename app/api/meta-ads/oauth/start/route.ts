import { NextResponse } from "next/server";
import { getCurrentUser } from "@/services/auth/session";
import { buildAuthorizeUrl, createOAuthState } from "@/services/metaAds/metaAdsOAuthService";

export const dynamic = "force-dynamic";

/** Ponto de entrada do "Conectar com a Meta" — exige sessão do CRM (rota
 * interna, não um webhook público) e redireciona para o diálogo OAuth da
 * Meta. O callback (app/api/meta-ads/oauth/callback) troca o code pelo
 * Access Token. Usa getCurrentUser() (não requireUser()) porque
 * next/navigation::redirect() não é o mecanismo certo dentro de um Route
 * Handler — aqui o redirecionamento é sempre um NextResponse.redirect(). */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  const state = await createOAuthState();
  const redirectUri = new URL("/api/meta-ads/oauth/callback", request.url).toString();
  const authorizeUrl = buildAuthorizeUrl(redirectUri, state);

  return NextResponse.redirect(authorizeUrl);
}
