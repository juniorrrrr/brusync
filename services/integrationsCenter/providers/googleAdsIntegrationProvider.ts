import "server-only";

import type {
  IntegrationProvider,
  IntegrationSelectableEntity,
  IntegrationStatusSnapshot,
} from "@/domain/integrations/provider";
import { CONNECTION_NOT_IMPLEMENTED_MESSAGE } from "@/domain/integrationsCenter/logEvents";
import { getDemoGoogleAdsAccount } from "@/lib/demo/mockGoogleAds";
import {
  getGoogleAdsAccountById,
  listUnselectedGoogleAdsAccounts,
} from "@/repositories/googleAds/accountsRepository";
import { getCurrentGoogleAdsTokenSecret } from "@/repositories/googleAds/tokensRepository";
import {
  createIntegrationLog,
  listIntegrationLogs,
} from "@/repositories/integrations/integrationLogsRepository";
import {
  countQueuedIntegrationSyncJobs,
  listRecentIntegrationSyncJobs,
} from "@/repositories/integrations/integrationSyncJobsRepository";
import { getIntegrationByProvider } from "@/repositories/integrations/integrationsRepository";
import { isDemoModeActive } from "@/services/demo/demoMode";
import {
  disconnectGoogleAdsAccount,
  getGoogleAdsAccount,
  selectGoogleAdsAccount,
} from "@/services/googleAds/googleAdsAccountService";
import { getGoogleAdsProvider } from "@/services/googleAds/googleAdsProviderFactory";
import { enqueueManualSync, processSyncJob } from "@/services/googleAds/googleAdsSyncService";
import { decryptSecret } from "@/services/security/tokenCrypto";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type { IntegrationLog } from "@/types/integrations";

const PROVIDER_KEY = "google_ads";

/** Google Ads API real (Fase 35) por trás do IntegrationProvider genérico
 * (Fase 34). Sem página própria (a Fase 35 proíbe criar uma): OAuth começa
 * em app/api/google-ads/oauth/start e a escolha da conta acontece via
 * listSelectableEntities/selectEntity, consumidos pelo GoogleEntityPicker
 * dentro do Drawer da Central de Integrações. */
export function createGoogleAdsIntegrationProvider(): IntegrationProvider {
  return {
    key: PROVIDER_KEY,
    isImplemented: () => true,
    getManageUrl: () => null,
    getConnectUrl: () => "/api/google-ads/oauth/start",

    async needsEntitySelection() {
      if (await isDemoModeActive()) return false;
      const supabase = await getSupabaseAuthClient();
      const [token, account] = await Promise.all([
        getCurrentGoogleAdsTokenSecret(supabase),
        getGoogleAdsAccount(),
      ]);
      return Boolean(token) && !account;
    },

    async listSelectableEntities(): Promise<IntegrationSelectableEntity[]> {
      const supabase = await getSupabaseAuthClient();
      const accounts = await listUnselectedGoogleAdsAccounts(supabase);
      return accounts.map((account) => ({
        id: account.id,
        label: account.descriptiveName ?? account.customerId,
        meta: `Customer ID ${account.customerId}${account.isManager ? " · Gerenciadora" : ""}`,
      }));
    },

    async selectEntity(entityId: string) {
      await selectGoogleAdsAccount(entityId, null);
    },

    async getStatus(): Promise<IntegrationStatusSnapshot> {
      const empty: IntegrationStatusSnapshot = {
        status: "desconectado",
        healthScore: null,
        lastSyncAt: null,
        nextSyncAt: null,
        tokenExpiresAt: null,
        queuedJobs: 0,
        averageDurationMs: null,
        error: null,
      };

      if (await isDemoModeActive()) {
        const demo = getDemoGoogleAdsAccount();
        return {
          ...empty,
          status: demo.status,
          healthScore: 92,
          lastSyncAt: demo.lastSyncAt,
          tokenExpiresAt: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString(),
        };
      }

      const supabase = await getSupabaseAuthClient();
      const [integration, account] = await Promise.all([
        getIntegrationByProvider(supabase, PROVIDER_KEY),
        getGoogleAdsAccount(),
      ]);
      if (!integration) return empty;
      if (!account) return { ...empty, status: integration.status, error: integration.error };

      const [tokenSecret, recentJobs, queuedJobs] = await Promise.all([
        getCurrentGoogleAdsTokenSecret(supabase),
        listRecentIntegrationSyncJobs(supabase, PROVIDER_KEY, 10),
        countQueuedIntegrationSyncJobs(supabase, PROVIDER_KEY),
      ]);
      const finished = recentJobs.filter((j) => j.status === "concluido");

      return {
        status: integration.status,
        healthScore: integration.healthScore,
        lastSyncAt: integration.lastSync,
        nextSyncAt: integration.nextSync,
        tokenExpiresAt: tokenSecret?.expires_at ?? null,
        queuedJobs,
        averageDurationMs:
          finished.length > 0
            ? Math.round(
                finished.reduce(
                  (sum, j) =>
                    sum +
                    (j.startedAt && j.finishedAt
                      ? new Date(j.finishedAt).getTime() - new Date(j.startedAt).getTime()
                      : 0),
                  0,
                ) / finished.length,
              )
            : null,
        error: integration.error,
      };
    },

    async testConnection() {
      if (await isDemoModeActive())
        return { ok: false, message: CONNECTION_NOT_IMPLEMENTED_MESSAGE };

      const account = await getGoogleAdsAccount();
      if (!account) return { ok: false, message: "Nenhuma conta conectada." };

      const supabase = await getSupabaseAuthClient();
      const tokenSecret = await getCurrentGoogleAdsTokenSecret(supabase);
      if (!tokenSecret) return { ok: false, message: "Nenhum Access Token salvo para esta conta." };

      const accessToken = decryptSecret(
        tokenSecret.access_token_ciphertext,
        tokenSecret.access_token_iv,
        "GOOGLE_TOKEN_ENCRYPTION_KEY",
      );
      const validation = await getGoogleAdsProvider().validateToken({ accessToken });

      const integration = await getIntegrationByProvider(supabase, PROVIDER_KEY);
      if (integration) {
        await createIntegrationLog(supabase, {
          integrationId: integration.id,
          event: "teste_executado",
          status: validation.ok ? "success" : "error",
          message: validation.ok
            ? "Token válido."
            : (validation.error ?? "Falha ao validar token."),
          origin: "crm",
          destination: PROVIDER_KEY,
        });
      }

      return {
        ok: validation.ok,
        message: validation.ok
          ? "Conexão validada com sucesso."
          : (validation.error ?? "Falha ao validar."),
      };
    },

    async syncNow(actorProfileId) {
      if (await isDemoModeActive()) {
        return {
          ok: true,
          message:
            "Sincronização simulada concluída — 4 campanhas, 30 dias de métricas atualizados. Nenhuma chamada real foi feita (Modo Demonstração).",
        };
      }

      const account = await getGoogleAdsAccount();
      if (!account) return { ok: false, message: "Nenhuma conta conectada." };

      const supabase = await getSupabaseAuthClient();
      try {
        const job = await enqueueManualSync(supabase, account.id, actorProfileId);
        await processSyncJob(supabase, job);
        const refreshed = await getGoogleAdsAccountById(supabase, account.id);
        if (refreshed?.status === "erro")
          return { ok: false, message: refreshed.error ?? "Falha ao sincronizar." };
        return { ok: true, message: "Sincronização concluída." };
      } catch (error) {
        return {
          ok: false,
          message: error instanceof Error ? error.message : "Falha ao sincronizar.",
        };
      }
    },

    async disconnect() {
      if (await isDemoModeActive()) return;
      const account = await getGoogleAdsAccount();
      if (account) await disconnectGoogleAdsAccount(account.id);
    },

    async getRecentLogs(limit = 20): Promise<IntegrationLog[]> {
      if (await isDemoModeActive()) return [];
      const supabase = await getSupabaseAuthClient();
      const { logs } = await listIntegrationLogs(supabase, { provider: PROVIDER_KEY, limit });
      return logs;
    },
  };
}
