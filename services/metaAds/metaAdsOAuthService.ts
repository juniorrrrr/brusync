import "server-only";

import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { createIntegrationLog } from "@/repositories/integrations/integrationLogsRepository";
import {
  getIntegrationByProvider,
  updateIntegration,
} from "@/repositories/integrations/integrationsRepository";
import { upsertMetaAccount } from "@/repositories/metaAds/accountsRepository";
import { enqueueSyncJob } from "@/repositories/metaAds/syncJobsRepository";
import { insertMetaToken } from "@/repositories/metaAds/tokensRepository";
import { getMetaAdsProvider } from "@/services/metaAds/metaAdsProviderFactory";
import { encryptToken } from "@/services/metaConversionsApi/tokenCrypto";
import { getSupabaseServerClient } from "@/services/supabase/server";
import type { MetaAccount } from "@/types/metaAds";

const META_ADS_MANAGER_PROVIDER = "meta_ads_manager";

const STATE_COOKIE = "meta_ads_oauth_state";

/** CSRF state — cookie de curta duração, mesmo padrão de qualquer fluxo
 * OAuth server-side (nunca vai para o cliente além do cookie httpOnly). */
export async function createOAuthState(): Promise<string> {
  const state = randomBytes(24).toString("hex");
  const store = await cookies();
  store.set(STATE_COOKIE, state, {
    path: "/",
    maxAge: 60 * 10,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return state;
}

export async function consumeOAuthState(receivedState: string): Promise<boolean> {
  const store = await cookies();
  const expected = store.get(STATE_COOKIE)?.value;
  store.delete(STATE_COOKIE);
  return Boolean(expected) && expected === receivedState;
}

export function buildAuthorizeUrl(redirectUri: string, state: string): string {
  return getMetaAdsProvider().buildAuthorizeUrl(redirectUri, state);
}

export interface HandleOAuthCallbackResult {
  ok: boolean;
  account?: MetaAccount;
  error?: string;
}

/** Troca o code recebido no callback por um token de longa duração, salva a
 * conta + token cifrado e enfileira a primeira sincronização completa —
 * chamado exclusivamente por app/api/meta-ads/oauth/callback/route.ts. */
export async function handleOAuthCallback(
  code: string,
  redirectUri: string,
  actorProfileId: string | null,
): Promise<HandleOAuthCallbackResult> {
  const provider = getMetaAdsProvider();
  const supabase = getSupabaseServerClient();

  try {
    const shortLived = await provider.exchangeCodeForToken({ code, redirectUri });
    const longLived = await provider.exchangeForLongLivedToken(shortLived.accessToken);

    const me = await provider.getMe({ accessToken: longLived.accessToken });

    const account = await upsertMetaAccount(supabase, {
      metaUserId: me.metaUserId,
      name: me.name,
      email: me.email,
      createdBy: actorProfileId,
    });

    const encrypted = encryptToken(longLived.accessToken);
    const expiresAt = longLived.expiresInSeconds
      ? new Date(Date.now() + longLived.expiresInSeconds * 1000).toISOString()
      : null;

    await insertMetaToken(supabase, {
      accountId: account.id,
      accessTokenCiphertext: encrypted.ciphertext,
      accessTokenIv: encrypted.iv,
      tokenType: "long_lived",
      scopes: [],
      expiresAt,
    });

    await enqueueSyncJob(supabase, {
      accountId: account.id,
      adAccountId: null,
      jobType: "full",
      triggerSource: "manual",
      createdBy: actorProfileId,
    });

    // Mantém a linha genérica de public.integrations (lida pelo board da
    // Central de Integrações, pela Central de Operações e pelo Drawer)
    // honesta sobre o estado real da conta — sem isso, meta_ads_manager
    // ficaria "desconectado" para sempre nessas telas mesmo já conectado.
    const integration = await getIntegrationByProvider(supabase, META_ADS_MANAGER_PROVIDER);
    if (integration) {
      await updateIntegration(supabase, META_ADS_MANAGER_PROVIDER, {
        status: "conectado",
        enabled: true,
        connectedAt: new Date().toISOString(),
        error: null,
      });
      await createIntegrationLog(supabase, {
        integrationId: integration.id,
        event: "conexao_criada",
        status: "success",
        message: `Conta conectada: ${me.name ?? me.metaUserId}.`,
        origin: "meta_ads_manager",
        destination: "crm",
      });
    }

    return { ok: true, account };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Falha ao conectar com a Meta.",
    };
  }
}
