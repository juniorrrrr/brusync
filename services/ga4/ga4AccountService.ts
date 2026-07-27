import "server-only";

import { getDemoGa4Property } from "@/lib/demo/mockGa4";
import {
  getGa4PropertyById,
  getSyncedGa4Property,
  listUnselectedGa4Properties,
  selectGa4Property as selectGa4PropertyRow,
  setGa4PropertyCrmLink,
  setGa4PropertyUnsynced,
} from "@/repositories/ga4/propertiesRepository";
import {
  getCurrentGa4TokenSecret,
  revokeGa4Tokens,
  updateGa4AccessToken,
} from "@/repositories/ga4/tokensRepository";
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
import type { Ga4Property } from "@/types/ga4";

const PROVIDER = "ga4";
const TOKEN_KEY_ENV_VAR = "GOOGLE_TOKEN_ENCRYPTION_KEY";
const REFRESH_MARGIN_MS = 5 * 60 * 1000;

export async function getGa4Property(): Promise<Ga4Property | null> {
  if (await isDemoModeActive()) return getDemoGa4Property();
  const supabase = await getSupabaseAuthClient();
  return getSyncedGa4Property(supabase);
}

export async function listSelectableGa4Properties(): Promise<Ga4Property[]> {
  const supabase = await getSupabaseAuthClient();
  return listUnselectedGa4Properties(supabase);
}

export async function getDecryptedGa4AccessToken(): Promise<string | null> {
  const supabase = await getSupabaseAuthClient();
  const secret = await getCurrentGa4TokenSecret(supabase);
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
  await updateGa4AccessToken(supabase, secret.id, encrypted.ciphertext, encrypted.iv, newExpiresAt);
  return renewed.accessToken;
}

export async function selectGa4Property(
  propertyId: string,
  actorProfileId: string | null,
): Promise<void> {
  const supabase = await getSupabaseAuthClient();
  await selectGa4PropertyRow(supabase, propertyId);

  const property = await getGa4PropertyById(supabase, propertyId);
  const suggestedClientId = await suggestClientIdForEntityName(property?.displayName ?? null);
  if (suggestedClientId) {
    await setGa4PropertyCrmLink(supabase, propertyId, suggestedClientId, null);
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
    initialStats: { propertyId },
  });
}

export async function disconnectGa4Property(propertyId: string): Promise<void> {
  const supabase = await getSupabaseAuthClient();

  const secret = await getCurrentGa4TokenSecret(supabase);
  if (secret) {
    const accessToken = decryptSecret(
      secret.access_token_ciphertext,
      secret.access_token_iv,
      TOKEN_KEY_ENV_VAR,
    );
    await revokeGoogleToken(accessToken);
  }

  await revokeGa4Tokens(supabase);
  await setGa4PropertyUnsynced(supabase, propertyId);

  const integration = await getIntegrationByProvider(supabase, PROVIDER);
  if (integration) {
    await updateIntegration(supabase, PROVIDER, {
      status: "desconectado",
      enabled: false,
      error: null,
    });
  }
}

export { getGa4PropertyById };
