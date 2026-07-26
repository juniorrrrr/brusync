import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/services/auth/session";
import { consumeOAuthState, handleOAuthCallback } from "@/services/metaAds/metaAdsOAuthService";

export const dynamic = "force-dynamic";

/** Callback do OAuth da Meta — troca o `code` pelo Access Token de longa
 * duração, salva a conta e enfileira a primeira sincronização completa
 * (services/metaAds/metaAdsOAuthService.ts::handleOAuthCallback). Sempre
 * redireciona de volta para Meta Ads → Configurações, com `connected=1` ou
 * `error=...` na querystring para o painel mostrar o resultado. */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const settingsUrl = new URL("/meta-ads/configuracoes", origin);

  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.redirect(new URL("/login", origin));

  const errorParam = searchParams.get("error");
  if (errorParam) {
    settingsUrl.searchParams.set("error", searchParams.get("error_description") ?? errorParam);
    return NextResponse.redirect(settingsUrl);
  }

  const code = searchParams.get("code");
  const state = searchParams.get("state");
  if (!code || !state) {
    settingsUrl.searchParams.set("error", "Requisição inválida do OAuth da Meta.");
    return NextResponse.redirect(settingsUrl);
  }

  const stateOk = await consumeOAuthState(state);
  if (!stateOk) {
    settingsUrl.searchParams.set("error", "Sessão de conexão expirada — tente novamente.");
    return NextResponse.redirect(settingsUrl);
  }

  const redirectUri = new URL("/api/meta-ads/oauth/callback", origin).toString();
  const result = await handleOAuthCallback(code, redirectUri, profile.id);

  if (!result.ok) {
    settingsUrl.searchParams.set("error", result.error ?? "Falha ao conectar com a Meta.");
    return NextResponse.redirect(settingsUrl);
  }

  settingsUrl.searchParams.set("connected", "1");
  return NextResponse.redirect(settingsUrl);
}
