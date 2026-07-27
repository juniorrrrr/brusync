import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { upsertGtmContainer } from "@/repositories/googleTagManager/containersRepository";
import { insertGtmToken, revokeGtmTokens } from "@/repositories/googleTagManager/tokensRepository";
import {
  buildGoogleAuthorizeUrl,
  exchangeGoogleCode,
} from "@/services/googleIntegrations/googleOAuthClient";
import {
  consumeGoogleOAuthState,
  createGoogleOAuthState,
} from "@/services/googleIntegrations/oauthState";
import { getGtmProvider } from "@/services/googleTagManager/gtmProviderFactory";
import { encryptSecret } from "@/services/security/tokenCrypto";
import { getSupabaseServerClient } from "@/services/supabase/server";

const STATE_COOKIE = "gtm_oauth_state";
const TOKEN_KEY_ENV_VAR = "GOOGLE_TOKEN_ENCRYPTION_KEY";
const SCOPES = ["https://www.googleapis.com/auth/tagmanager.readonly"];

export async function createGtmOAuthState(): Promise<string> {
  return createGoogleOAuthState(STATE_COOKIE);
}

export async function consumeGtmOAuthState(receivedState: string): Promise<boolean> {
  return consumeGoogleOAuthState(STATE_COOKIE, receivedState);
}

export function buildGtmAuthorizeUrl(redirectUri: string, state: string): string {
  return buildGoogleAuthorizeUrl({ scopes: SCOPES, redirectUri, state });
}

export interface HandleGtmOAuthCallbackResult {
  ok: boolean;
  error?: string;
}

/** Troca o code, lista as contas GTM acessíveis e "achata" os containers de
 * todas elas numa única lista de candidatas (is_synced=false) — um login
 * Google pode ter mais de uma conta GTM. A escolha de qual container
 * sincronizar acontece no Drawer (GoogleEntityPicker). */
export async function handleGtmOAuthCallback(
  code: string,
  redirectUri: string,
  actorProfileId: string | null,
): Promise<HandleGtmOAuthCallbackResult> {
  const provider = getGtmProvider();
  const supabase: SupabaseClient = getSupabaseServerClient();

  try {
    const tokenResult = await exchangeGoogleCode({ code, redirectUri });
    const encryptedAccess = encryptSecret(tokenResult.accessToken, TOKEN_KEY_ENV_VAR);
    const encryptedRefresh = tokenResult.refreshToken
      ? encryptSecret(tokenResult.refreshToken, TOKEN_KEY_ENV_VAR)
      : null;
    const expiresAt = new Date(Date.now() + tokenResult.expiresInSeconds * 1000).toISOString();

    await insertGtmToken(supabase, {
      googleAccountEmail: null,
      accessTokenCiphertext: encryptedAccess.ciphertext,
      accessTokenIv: encryptedAccess.iv,
      refreshTokenCiphertext: encryptedRefresh?.ciphertext ?? null,
      refreshTokenIv: encryptedRefresh?.iv ?? null,
      scopes: SCOPES,
      expiresAt,
      createdBy: actorProfileId,
    });

    const credentials = { accessToken: tokenResult.accessToken };
    const accounts = await provider.listAccounts(credentials);
    for (const account of accounts) {
      const containers = await provider.listContainers(credentials, account.accountId);
      for (const container of containers) {
        await upsertGtmContainer(supabase, {
          containerId: container.containerId,
          accountIdExternal: account.accountId,
          name: container.name,
          publicId: container.publicId,
          usageContext: container.usageContext,
          createdBy: actorProfileId,
        });
      }
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Falha ao conectar com o GTM.",
    };
  }
}

export async function revokeGtmOAuth(supabase: SupabaseClient): Promise<void> {
  await revokeGtmTokens(supabase);
}
