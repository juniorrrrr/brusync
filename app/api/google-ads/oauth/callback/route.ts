import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/services/auth/session";
import {
  consumeGoogleAdsOAuthState,
  handleGoogleAdsOAuthCallback,
} from "@/services/googleAds/googleAdsOAuthService";

export const dynamic = "force-dynamic";

/** Callback do OAuth do Google Ads — troca o `code` pelos tokens, descobre
 * as contas acessíveis e volta para a Central de Integrações (não existe
 * página própria do Google Ads nesta fase). A escolha de qual conta
 * sincronizar acontece no Drawer (GoogleEntityPicker), não aqui. */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const integracoesUrl = new URL("/integracoes", origin);

  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.redirect(new URL("/login", origin));

  const errorParam = searchParams.get("error");
  if (errorParam) {
    integracoesUrl.searchParams.set("error", searchParams.get("error_description") ?? errorParam);
    return NextResponse.redirect(integracoesUrl);
  }

  const code = searchParams.get("code");
  const state = searchParams.get("state");
  if (!code || !state) {
    integracoesUrl.searchParams.set("error", "Requisição inválida do OAuth do Google.");
    return NextResponse.redirect(integracoesUrl);
  }

  const stateOk = await consumeGoogleAdsOAuthState(state);
  if (!stateOk) {
    integracoesUrl.searchParams.set("error", "Sessão de conexão expirada — tente novamente.");
    return NextResponse.redirect(integracoesUrl);
  }

  const redirectUri = new URL("/api/google-ads/oauth/callback", origin).toString();
  const result = await handleGoogleAdsOAuthCallback(code, redirectUri, profile.id);

  if (!result.ok) {
    integracoesUrl.searchParams.set("error", result.error ?? "Falha ao conectar com o Google Ads.");
    return NextResponse.redirect(integracoesUrl);
  }

  integracoesUrl.searchParams.set("connected", "google_ads");
  return NextResponse.redirect(integracoesUrl);
}
