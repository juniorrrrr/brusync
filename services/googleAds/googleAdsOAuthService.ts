import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { upsertGoogleAdsAccount } from "@/repositories/googleAds/accountsRepository";
import {
  insertGoogleAdsToken,
  revokeGoogleAdsTokens,
} from "@/repositories/googleAds/tokensRepository";
import { getGoogleAdsProvider } from "@/services/googleAds/googleAdsProviderFactory";
import {
  consumeGoogleOAuthState,
  createGoogleOAuthState,
} from "@/services/googleIntegrations/oauthState";
import { encryptSecret } from "@/services/security/tokenCrypto";
import { getSupabaseServerClient } from "@/services/supabase/server";

const STATE_COOKIE = "google_ads_oauth_state";
const TOKEN_KEY_ENV_VAR = "GOOGLE_TOKEN_ENCRYPTION_KEY";

export async function createGoogleAdsOAuthState(): Promise<string> {
  return createGoogleOAuthState(STATE_COOKIE);
}

export async function consumeGoogleAdsOAuthState(receivedState: string): Promise<boolean> {
  return consumeGoogleOAuthState(STATE_COOKIE, receivedState);
}

export function buildGoogleAdsAuthorizeUrl(redirectUri: string, state: string): string {
  return getGoogleAdsProvider().buildAuthorizeUrl(redirectUri, state);
}

export interface HandleGoogleAdsOAuthCallbackResult {
  ok: boolean;
  error?: string;
}

/** Troca o code por tokens, descobre as contas acessíveis e as grava como
 * candidatas (is_synced=false) — a escolha de qual sincronizar acontece
 * depois, no Drawer da Central de Integrações (GoogleEntityPicker), nunca
 * numa página própria. Não marca public.integrations como "conectado" ainda
 * — isso só acontece quando uma conta é de fato selecionada
 * (googleAdsAccountService.ts::selectAccount), critério que
 * IntegrationProvider.needsEntitySelection() usa para decidir se mostra o
 * picker. */
export async function handleGoogleAdsOAuthCallback(
  code: string,
  redirectUri: string,
  actorProfileId: string | null,
): Promise<HandleGoogleAdsOAuthCallbackResult> {
  const provider = getGoogleAdsProvider();
  const supabase: SupabaseClient = getSupabaseServerClient();

  try {
    const tokenResult = await provider.exchangeCodeForToken(code, redirectUri);
    const encryptedAccess = encryptSecret(tokenResult.accessToken, TOKEN_KEY_ENV_VAR);
    const encryptedRefresh = tokenResult.refreshToken
      ? encryptSecret(tokenResult.refreshToken, TOKEN_KEY_ENV_VAR)
      : null;
    const expiresAt = new Date(Date.now() + tokenResult.expiresInSeconds * 1000).toISOString();

    await insertGoogleAdsToken(supabase, {
      googleAccountEmail: null,
      accessTokenCiphertext: encryptedAccess.ciphertext,
      accessTokenIv: encryptedAccess.iv,
      refreshTokenCiphertext: encryptedRefresh?.ciphertext ?? null,
      refreshTokenIv: encryptedRefresh?.iv ?? null,
      scopes: ["https://www.googleapis.com/auth/adwords"],
      expiresAt,
      createdBy: actorProfileId,
    });

    const customerIds = await provider.listAccessibleCustomers({
      accessToken: tokenResult.accessToken,
    });

    for (const customerId of customerIds) {
      try {
        const info = await provider.getCustomerInfo(
          { accessToken: tokenResult.accessToken },
          customerId,
        );
        await upsertGoogleAdsAccount(supabase, {
          customerId,
          descriptiveName: info.descriptiveName,
          currencyCode: info.currencyCode,
          timeZone: info.timeZone,
          isManager: info.isManager,
          createdBy: actorProfileId,
        });
      } catch {
        // Uma conta filha inacessível (permissão negada pelo Google) não
        // deve interromper a descoberta das demais.
        await upsertGoogleAdsAccount(supabase, {
          customerId,
          descriptiveName: null,
          currencyCode: null,
          timeZone: null,
          isManager: false,
          createdBy: actorProfileId,
        });
      }
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Falha ao conectar com o Google Ads.",
    };
  }
}

export async function revokeGoogleAdsOAuth(supabase: SupabaseClient): Promise<void> {
  await revokeGoogleAdsTokens(supabase);
}
