import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/services/auth/session";
import {
  consumeSearchConsoleOAuthState,
  handleSearchConsoleOAuthCallback,
} from "@/services/searchConsole/searchConsoleOAuthService";

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

  const stateOk = await consumeSearchConsoleOAuthState(state);
  if (!stateOk) {
    integracoesUrl.searchParams.set("error", "Sessão de conexão expirada — tente novamente.");
    return NextResponse.redirect(integracoesUrl);
  }

  const redirectUri = new URL("/api/search-console/oauth/callback", origin).toString();
  const result = await handleSearchConsoleOAuthCallback(code, redirectUri, profile.id);

  if (!result.ok) {
    integracoesUrl.searchParams.set(
      "error",
      result.error ?? "Falha ao conectar com o Search Console.",
    );
    return NextResponse.redirect(integracoesUrl);
  }

  integracoesUrl.searchParams.set("connected", "search_console");
  return NextResponse.redirect(integracoesUrl);
}
