import "server-only";

import { getDemoSearchConsoleSite } from "@/lib/demo/mockSearchConsole";
import { enqueueIntegrationSyncJob } from "@/repositories/integrations/integrationSyncJobsRepository";
import {
  getIntegrationByProvider,
  updateIntegration,
} from "@/repositories/integrations/integrationsRepository";
import {
  getSearchConsoleSiteById,
  getSyncedSearchConsoleSite,
  listUnselectedSearchConsoleSites,
  selectSearchConsoleSite as selectSearchConsoleSiteRow,
  setSearchConsoleSiteCrmLink,
  setSearchConsoleSiteUnsynced,
} from "@/repositories/searchConsole/sitesRepository";
import {
  getCurrentSearchConsoleTokenSecret,
  revokeSearchConsoleTokens,
  updateSearchConsoleAccessToken,
} from "@/repositories/searchConsole/tokensRepository";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { suggestClientIdForEntityName } from "@/services/googleIntegrations/googleCrmLinkService";
import {
  refreshGoogleAccessToken,
  revokeGoogleToken,
} from "@/services/googleIntegrations/googleOAuthClient";
import { decryptSecret, encryptSecret } from "@/services/security/tokenCrypto";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type { SearchConsoleSite } from "@/types/searchConsole";

const PROVIDER = "search_console";
const TOKEN_KEY_ENV_VAR = "GOOGLE_TOKEN_ENCRYPTION_KEY";
const REFRESH_MARGIN_MS = 5 * 60 * 1000;

export async function getSearchConsoleSite(): Promise<SearchConsoleSite | null> {
  if (await isDemoModeActive()) return getDemoSearchConsoleSite();
  const supabase = await getSupabaseAuthClient();
  return getSyncedSearchConsoleSite(supabase);
}

export async function listSelectableSearchConsoleSites(): Promise<SearchConsoleSite[]> {
  const supabase = await getSupabaseAuthClient();
  return listUnselectedSearchConsoleSites(supabase);
}

export async function getDecryptedSearchConsoleAccessToken(): Promise<string | null> {
  const supabase = await getSupabaseAuthClient();
  const secret = await getCurrentSearchConsoleTokenSecret(supabase);
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
  await updateSearchConsoleAccessToken(
    supabase,
    secret.id,
    encrypted.ciphertext,
    encrypted.iv,
    newExpiresAt,
  );
  return renewed.accessToken;
}

export async function selectSearchConsoleSite(
  siteId: string,
  actorProfileId: string | null,
): Promise<void> {
  const supabase = await getSupabaseAuthClient();
  await selectSearchConsoleSiteRow(supabase, siteId);

  const site = await getSearchConsoleSiteById(supabase, siteId);
  const bareDomain = site?.siteUrl.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "") ?? null;
  const suggestedClientId = await suggestClientIdForEntityName(bareDomain);
  if (suggestedClientId) {
    await setSearchConsoleSiteCrmLink(supabase, siteId, suggestedClientId, null);
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
    initialStats: { siteId },
  });
}

export async function disconnectSearchConsoleSite(siteId: string): Promise<void> {
  const supabase = await getSupabaseAuthClient();

  const secret = await getCurrentSearchConsoleTokenSecret(supabase);
  if (secret) {
    const accessToken = decryptSecret(
      secret.access_token_ciphertext,
      secret.access_token_iv,
      TOKEN_KEY_ENV_VAR,
    );
    await revokeGoogleToken(accessToken);
  }

  await revokeSearchConsoleTokens(supabase);
  await setSearchConsoleSiteUnsynced(supabase, siteId);

  const integration = await getIntegrationByProvider(supabase, PROVIDER);
  if (integration) {
    await updateIntegration(supabase, PROVIDER, {
      status: "desconectado",
      enabled: false,
      error: null,
    });
  }
}

export { getSearchConsoleSiteById };
