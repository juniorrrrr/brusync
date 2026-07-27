import "server-only";

import { getDemoGoogleAdsAccount } from "@/lib/demo/mockGoogleAds";
import {
  getGoogleAdsAccountById,
  getSyncedGoogleAdsAccount,
  listUnselectedGoogleAdsAccounts,
  selectGoogleAdsAccount as selectGoogleAdsAccountRow,
  setGoogleAdsAccountCrmLink,
  setGoogleAdsAccountUnsynced,
} from "@/repositories/googleAds/accountsRepository";
import {
  getCurrentGoogleAdsTokenSecret,
  revokeGoogleAdsTokens,
  updateGoogleAdsAccessToken,
} from "@/repositories/googleAds/tokensRepository";
import { enqueueIntegrationSyncJob } from "@/repositories/integrations/integrationSyncJobsRepository";
import {
  getIntegrationByProvider,
  updateIntegration,
} from "@/repositories/integrations/integrationsRepository";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { suggestClientIdForEntityName } from "@/services/googleIntegrations/googleCrmLinkService";
import {
  refreshGoogleAccessToken,
  revokeGoogleToken,
} from "@/services/googleIntegrations/googleOAuthClient";
import { decryptSecret, encryptSecret } from "@/services/security/tokenCrypto";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type { GoogleAdsAccount } from "@/types/googleAds";

const PROVIDER = "google_ads";
const TOKEN_KEY_ENV_VAR = "GOOGLE_TOKEN_ENCRYPTION_KEY";
/** Renova quando faltar menos de 5 minutos para expirar — mesma folga usada
 * por qualquer refresh-token flow razoável, evita corrida com a expiração
 * real do Google (tokens de acesso duram ~1h). */
const REFRESH_MARGIN_MS = 5 * 60 * 1000;

export async function getGoogleAdsAccount(): Promise<GoogleAdsAccount | null> {
  if (await isDemoModeActive()) return getDemoGoogleAdsAccount();
  const supabase = await getSupabaseAuthClient();
  return getSyncedGoogleAdsAccount(supabase);
}

export async function listSelectableGoogleAdsAccounts(): Promise<GoogleAdsAccount[]> {
  const supabase = await getSupabaseAuthClient();
  return listUnselectedGoogleAdsAccounts(supabase);
}

/** Descriptografa o Access Token vigente, renovando-o primeiro (refresh
 * token) se estiver perto de expirar — "renovação automática" pedida pelo
 * briefing. Só chamado pelo motor de sincronização, nunca por um Client
 * Component. */
export async function getDecryptedGoogleAdsAccessToken(): Promise<string | null> {
  const supabase = await getSupabaseAuthClient();
  const secret = await getCurrentGoogleAdsTokenSecret(supabase);
  if (!secret) return null;

  const expiresAt = secret.expires_at ? new Date(secret.expires_at).getTime() : 0;
  if (expiresAt - Date.now() > REFRESH_MARGIN_MS) {
    return decryptSecret(secret.access_token_ciphertext, secret.access_token_iv, TOKEN_KEY_ENV_VAR);
  }

  if (!secret.refresh_token_ciphertext || !secret.refresh_token_iv) {
    return decryptSecret(secret.access_token_ciphertext, secret.access_token_iv, TOKEN_KEY_ENV_VAR);
  }

  const refreshToken = decryptSecret(
    secret.refresh_token_ciphertext,
    secret.refresh_token_iv,
    TOKEN_KEY_ENV_VAR,
  );
  const renewed = await refreshGoogleAccessToken(refreshToken);
  const encrypted = encryptSecret(renewed.accessToken, TOKEN_KEY_ENV_VAR);
  const newExpiresAt = new Date(Date.now() + renewed.expiresInSeconds * 1000).toISOString();
  await updateGoogleAdsAccessToken(
    supabase,
    secret.id,
    encrypted.ciphertext,
    encrypted.iv,
    newExpiresAt,
  );
  return renewed.accessToken;
}

/** Marca a conta como selecionada, ativa a integração genérica
 * (public.integrations) e enfileira a primeira sincronização completa —
 * segunda metade do fluxo "Escolha da conta" iniciado no OAuth callback. */
export async function selectGoogleAdsAccount(
  accountId: string,
  actorProfileId: string | null,
): Promise<void> {
  const supabase = await getSupabaseAuthClient();
  await selectGoogleAdsAccountRow(supabase, accountId);

  const account = await getGoogleAdsAccountById(supabase, accountId);
  const suggestedClientId = await suggestClientIdForEntityName(account?.descriptiveName ?? null);
  if (suggestedClientId) {
    await setGoogleAdsAccountCrmLink(supabase, accountId, suggestedClientId, null);
  }

  const integration = await getIntegrationByProvider(supabase, PROVIDER);
  if (integration) {
    await updateIntegration(supabase, PROVIDER, {
      status: "conectado",
      enabled: true,
      connectedAt: new Date().toISOString(),
      error: null,
    });
  }

  await enqueueIntegrationSyncJob(supabase, {
    integrationId: integration?.id ?? null,
    provider: PROVIDER,
    jobType: "full",
    triggerSource: "manual",
    createdBy: actorProfileId,
  });
}

export async function disconnectGoogleAdsAccount(accountId: string): Promise<void> {
  const supabase = await getSupabaseAuthClient();

  const secret = await getCurrentGoogleAdsTokenSecret(supabase);
  if (secret) {
    const accessToken = decryptSecret(
      secret.access_token_ciphertext,
      secret.access_token_iv,
      TOKEN_KEY_ENV_VAR,
    );
    await revokeGoogleToken(accessToken);
  }

  await revokeGoogleAdsTokens(supabase);
  await setGoogleAdsAccountUnsynced(supabase, accountId);

  const integration = await getIntegrationByProvider(supabase, PROVIDER);
  if (integration) {
    await updateIntegration(supabase, PROVIDER, {
      status: "desconectado",
      enabled: false,
      error: null,
    });
  }
}

export { getGoogleAdsAccountById };
