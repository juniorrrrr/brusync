import "server-only";

import { getDemoGtmContainer } from "@/lib/demo/mockGtm";
import {
  getGtmContainerById,
  getSyncedGtmContainer,
  listUnselectedGtmContainers,
  selectGtmContainer as selectGtmContainerRow,
  setGtmContainerCrmLink,
  setGtmContainerUnsynced,
} from "@/repositories/googleTagManager/containersRepository";
import {
  getCurrentGtmTokenSecret,
  revokeGtmTokens,
  updateGtmAccessToken,
} from "@/repositories/googleTagManager/tokensRepository";
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
import type { GtmContainer } from "@/types/gtm";

const PROVIDER = "gtm";
const TOKEN_KEY_ENV_VAR = "GOOGLE_TOKEN_ENCRYPTION_KEY";
const REFRESH_MARGIN_MS = 5 * 60 * 1000;

export async function getGtmContainer(): Promise<GtmContainer | null> {
  if (await isDemoModeActive()) return getDemoGtmContainer();
  const supabase = await getSupabaseAuthClient();
  return getSyncedGtmContainer(supabase);
}

export async function listSelectableGtmContainers(): Promise<GtmContainer[]> {
  const supabase = await getSupabaseAuthClient();
  return listUnselectedGtmContainers(supabase);
}

export async function getDecryptedGtmAccessToken(): Promise<string | null> {
  const supabase = await getSupabaseAuthClient();
  const secret = await getCurrentGtmTokenSecret(supabase);
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
  await updateGtmAccessToken(supabase, secret.id, encrypted.ciphertext, encrypted.iv, newExpiresAt);
  return renewed.accessToken;
}

export async function selectGtmContainer(
  containerId: string,
  actorProfileId: string | null,
): Promise<void> {
  const supabase = await getSupabaseAuthClient();
  await selectGtmContainerRow(supabase, containerId);

  const container = await getGtmContainerById(supabase, containerId);
  const suggestedClientId = await suggestClientIdForEntityName(container?.name ?? null);
  if (suggestedClientId) {
    await setGtmContainerCrmLink(supabase, containerId, suggestedClientId, null);
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
    initialStats: { containerId },
  });
}

export async function disconnectGtmContainer(containerId: string): Promise<void> {
  const supabase = await getSupabaseAuthClient();

  const secret = await getCurrentGtmTokenSecret(supabase);
  if (secret) {
    const accessToken = decryptSecret(
      secret.access_token_ciphertext,
      secret.access_token_iv,
      TOKEN_KEY_ENV_VAR,
    );
    await revokeGoogleToken(accessToken);
  }

  await revokeGtmTokens(supabase);
  await setGtmContainerUnsynced(supabase, containerId);

  const integration = await getIntegrationByProvider(supabase, PROVIDER);
  if (integration) {
    await updateIntegration(supabase, PROVIDER, {
      status: "desconectado",
      enabled: false,
      error: null,
    });
  }
}

export { getGtmContainerById };
