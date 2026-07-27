import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/services/auth/session";
import { consumeGa4OAuthState, handleGa4OAuthCallback } from "@/services/ga4/ga4OAuthService";

export const dynamic = "force-dynamic";

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

  const stateOk = await consumeGa4OAuthState(state);
  if (!stateOk) {
    integracoesUrl.searchParams.set("error", "Sessão de conexão expirada — tente novamente.");
    return NextResponse.redirect(integracoesUrl);
  }

  const redirectUri = new URL("/api/ga4/oauth/callback", origin).toString();
  const result = await handleGa4OAuthCallback(code, redirectUri, profile.id);

  if (!result.ok) {
    integracoesUrl.searchParams.set("error", result.error ?? "Falha ao conectar com o GA4.");
    return NextResponse.redirect(integracoesUrl);
  }

  integracoesUrl.searchParams.set("connected", "ga4");
  return NextResponse.redirect(integracoesUrl);
}
