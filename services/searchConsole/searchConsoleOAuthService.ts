import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { upsertSearchConsoleSite } from "@/repositories/searchConsole/sitesRepository";
import {
  insertSearchConsoleToken,
  revokeSearchConsoleTokens,
} from "@/repositories/searchConsole/tokensRepository";
import {
  buildGoogleAuthorizeUrl,
  exchangeGoogleCode,
} from "@/services/googleIntegrations/googleOAuthClient";
import {
  consumeGoogleOAuthState,
  createGoogleOAuthState,
} from "@/services/googleIntegrations/oauthState";
import { getSearchConsoleProvider } from "@/services/searchConsole/searchConsoleProviderFactory";
import { encryptSecret } from "@/services/security/tokenCrypto";
import { getSupabaseServerClient } from "@/services/supabase/server";

const STATE_COOKIE = "search_console_oauth_state";
const TOKEN_KEY_ENV_VAR = "GOOGLE_TOKEN_ENCRYPTION_KEY";
const SCOPES = ["https://www.googleapis.com/auth/webmasters.readonly"];

export async function createSearchConsoleOAuthState(): Promise<string> {
  return createGoogleOAuthState(STATE_COOKIE);
}

export async function consumeSearchConsoleOAuthState(receivedState: string): Promise<boolean> {
  return consumeGoogleOAuthState(STATE_COOKIE, receivedState);
}

export function buildSearchConsoleAuthorizeUrl(redirectUri: string, state: string): string {
  return buildGoogleAuthorizeUrl({ scopes: SCOPES, redirectUri, state });
}

export interface HandleSearchConsoleOAuthCallbackResult {
  ok: boolean;
  error?: string;
}

/** Troca o code e descobre os sites acessíveis, gravando-os como candidatos
 * (is_synced=false) — a escolha de qual sincronizar acontece no Drawer da
 * Central de Integrações (GoogleEntityPicker), nunca numa página própria. */
export async function handleSearchConsoleOAuthCallback(
  code: string,
  redirectUri: string,
  actorProfileId: string | null,
): Promise<HandleSearchConsoleOAuthCallbackResult> {
  const provider = getSearchConsoleProvider();
  const supabase: SupabaseClient = getSupabaseServerClient();

  try {
    const tokenResult = await exchangeGoogleCode({ code, redirectUri });
    const encryptedAccess = encryptSecret(tokenResult.accessToken, TOKEN_KEY_ENV_VAR);
    const encryptedRefresh = tokenResult.refreshToken
      ? encryptSecret(tokenResult.refreshToken, TOKEN_KEY_ENV_VAR)
      : null;
    const expiresAt = new Date(Date.now() + tokenResult.expiresInSeconds * 1000).toISOString();

    await insertSearchConsoleToken(supabase, {
      googleAccountEmail: null,
      accessTokenCiphertext: encryptedAccess.ciphertext,
      accessTokenIv: encryptedAccess.iv,
      refreshTokenCiphertext: encryptedRefresh?.ciphertext ?? null,
      refreshTokenIv: encryptedRefresh?.iv ?? null,
      scopes: SCOPES,
      expiresAt,
      createdBy: actorProfileId,
    });

    const sites = await provider.listSites({ accessToken: tokenResult.accessToken });
    for (const site of sites) {
      await upsertSearchConsoleSite(supabase, {
        siteUrl: site.siteUrl,
        permissionLevel: site.permissionLevel,
        createdBy: actorProfileId,
      });
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Falha ao conectar com o Search Console.",
    };
  }
}

export async function revokeSearchConsoleOAuth(supabase: SupabaseClient): Promise<void> {
  await revokeSearchConsoleTokens(supabase);
}
