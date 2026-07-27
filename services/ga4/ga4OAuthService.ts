import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { upsertGa4Property } from "@/repositories/ga4/propertiesRepository";
import { insertGa4Token, revokeGa4Tokens } from "@/repositories/ga4/tokensRepository";
import { getGa4Provider } from "@/services/ga4/ga4ProviderFactory";
import {
  buildGoogleAuthorizeUrl,
  exchangeGoogleCode,
} from "@/services/googleIntegrations/googleOAuthClient";
import {
  consumeGoogleOAuthState,
  createGoogleOAuthState,
} from "@/services/googleIntegrations/oauthState";
import { encryptSecret } from "@/services/security/tokenCrypto";
import { getSupabaseServerClient } from "@/services/supabase/server";

const STATE_COOKIE = "ga4_oauth_state";
const TOKEN_KEY_ENV_VAR = "GOOGLE_TOKEN_ENCRYPTION_KEY";
const SCOPES = ["https://www.googleapis.com/auth/analytics.readonly"];

export async function createGa4OAuthState(): Promise<string> {
  return createGoogleOAuthState(STATE_COOKIE);
}

export async function consumeGa4OAuthState(receivedState: string): Promise<boolean> {
  return consumeGoogleOAuthState(STATE_COOKIE, receivedState);
}

export function buildGa4AuthorizeUrl(redirectUri: string, state: string): string {
  return buildGoogleAuthorizeUrl({ scopes: SCOPES, redirectUri, state });
}

export interface HandleGa4OAuthCallbackResult {
  ok: boolean;
  error?: string;
}

/** Troca o code, descobre as propriedades acessíveis e as grava como
 * candidatas (is_synced=false) — a escolha de qual sincronizar acontece no
 * Drawer da Central de Integrações (GoogleEntityPicker), nunca numa página
 * própria. Não marca public.integrations "conectado" ainda. */
export async function handleGa4OAuthCallback(
  code: string,
  redirectUri: string,
  actorProfileId: string | null,
): Promise<HandleGa4OAuthCallbackResult> {
  const provider = getGa4Provider();
  const supabase: SupabaseClient = getSupabaseServerClient();

  try {
    const tokenResult = await exchangeGoogleCode({ code, redirectUri });
    const encryptedAccess = encryptSecret(tokenResult.accessToken, TOKEN_KEY_ENV_VAR);
    const encryptedRefresh = tokenResult.refreshToken
      ? encryptSecret(tokenResult.refreshToken, TOKEN_KEY_ENV_VAR)
      : null;
    const expiresAt = new Date(Date.now() + tokenResult.expiresInSeconds * 1000).toISOString();

    await insertGa4Token(supabase, {
      googleAccountEmail: null,
      accessTokenCiphertext: encryptedAccess.ciphertext,
      accessTokenIv: encryptedAccess.iv,
      refreshTokenCiphertext: encryptedRefresh?.ciphertext ?? null,
      refreshTokenIv: encryptedRefresh?.iv ?? null,
      scopes: SCOPES,
      expiresAt,
      createdBy: actorProfileId,
    });

    const properties = await provider.listProperties({ accessToken: tokenResult.accessToken });
    for (const property of properties) {
      await upsertGa4Property(supabase, {
        propertyId: property.propertyId,
        displayName: property.displayName,
        timeZone: property.timeZone,
        currencyCode: property.currencyCode,
        createdBy: actorProfileId,
      });
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Falha ao conectar com o GA4.",
    };
  }
}

export async function revokeGa4OAuth(supabase: SupabaseClient): Promise<void> {
  await revokeGa4Tokens(supabase);
}
