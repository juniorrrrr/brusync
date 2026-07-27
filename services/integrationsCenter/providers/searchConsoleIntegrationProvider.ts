import "server-only";

import type {
  IntegrationProvider,
  IntegrationSelectableEntity,
  IntegrationStatusSnapshot,
} from "@/domain/integrations/provider";
import { CONNECTION_NOT_IMPLEMENTED_MESSAGE } from "@/domain/integrationsCenter/logEvents";
import { getDemoSearchConsoleSite } from "@/lib/demo/mockSearchConsole";
import {
  createIntegrationLog,
  listIntegrationLogs,
} from "@/repositories/integrations/integrationLogsRepository";
import {
  countQueuedIntegrationSyncJobs,
  listRecentIntegrationSyncJobs,
} from "@/repositories/integrations/integrationSyncJobsRepository";
import { getIntegrationByProvider } from "@/repositories/integrations/integrationsRepository";
import {
  getSearchConsoleSiteById,
  listUnselectedSearchConsoleSites,
} from "@/repositories/searchConsole/sitesRepository";
import { getCurrentSearchConsoleTokenSecret } from "@/repositories/searchConsole/tokensRepository";
import { isDemoModeActive } from "@/services/demo/demoMode";
import {
  disconnectSearchConsoleSite,
  getSearchConsoleSite,
  selectSearchConsoleSite,
} from "@/services/searchConsole/searchConsoleAccountService";
import { getSearchConsoleProvider } from "@/services/searchConsole/searchConsoleProviderFactory";
import {
  enqueueManualSync,
  processSyncJob,
} from "@/services/searchConsole/searchConsoleSyncService";
import { decryptSecret } from "@/services/security/tokenCrypto";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type { IntegrationLog } from "@/types/integrations";

const PROVIDER_KEY = "search_console";
const TOKEN_KEY_ENV_VAR = "GOOGLE_TOKEN_ENCRYPTION_KEY";

export function createSearchConsoleIntegrationProvider(): IntegrationProvider {
  return {
    key: PROVIDER_KEY,
    isImplemented: () => true,
    getManageUrl: () => null,
    getConnectUrl: () => "/api/search-console/oauth/start",

    async needsEntitySelection() {
      if (await isDemoModeActive()) return false;
      const supabase = await getSupabaseAuthClient();
      const [token, site] = await Promise.all([
        getCurrentSearchConsoleTokenSecret(supabase),
        getSearchConsoleSite(),
      ]);
      return Boolean(token) && !site;
    },

    async listSelectableEntities(): Promise<IntegrationSelectableEntity[]> {
      const supabase = await getSupabaseAuthClient();
      const sites = await listUnselectedSearchConsoleSites(supabase);
      return sites.map((site) => ({
        id: site.id,
        label: site.siteUrl,
        meta: site.permissionLevel ?? undefined,
      }));
    },

    async selectEntity(entityId: string) {
      await selectSearchConsoleSite(entityId, null);
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
        const demo = getDemoSearchConsoleSite();
        return {
          ...empty,
          status: demo.status,
          healthScore: 98,
          lastSyncAt: demo.lastSyncAt,
          tokenExpiresAt: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString(),
        };
      }

      const supabase = await getSupabaseAuthClient();
      const [integration, site] = await Promise.all([
        getIntegrationByProvider(supabase, PROVIDER_KEY),
        getSearchConsoleSite(),
      ]);
      if (!integration) return empty;
      if (!site) return { ...empty, status: integration.status, error: integration.error };

      const [tokenSecret, recentJobs, queuedJobs] = await Promise.all([
        getCurrentSearchConsoleTokenSecret(supabase),
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

      const site = await getSearchConsoleSite();
      if (!site) return { ok: false, message: "Nenhum site conectado." };

      const supabase = await getSupabaseAuthClient();
      const tokenSecret = await getCurrentSearchConsoleTokenSecret(supabase);
      if (!tokenSecret) return { ok: false, message: "Nenhum Access Token salvo para este site." };

      const accessToken = decryptSecret(
        tokenSecret.access_token_ciphertext,
        tokenSecret.access_token_iv,
        TOKEN_KEY_ENV_VAR,
      );
      const validation = await getSearchConsoleProvider().validateToken({ accessToken });

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
            "Sincronização simulada concluída — 10 consultas, 5 páginas, 2 sitemaps atualizados. Nenhuma chamada real foi feita (Modo Demonstração).",
        };
      }

      const site = await getSearchConsoleSite();
      if (!site) return { ok: false, message: "Nenhum site conectado." };

      const supabase = await getSupabaseAuthClient();
      try {
        const job = await enqueueManualSync(supabase, site.id, actorProfileId);
        await processSyncJob(supabase, job);
        const refreshed = await getSearchConsoleSiteById(supabase, site.id);
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
      const site = await getSearchConsoleSite();
      if (site) await disconnectSearchConsoleSite(site.id);
    },

    async getRecentLogs(limit = 20): Promise<IntegrationLog[]> {
      if (await isDemoModeActive()) return [];
      const supabase = await getSupabaseAuthClient();
      const { logs } = await listIntegrationLogs(supabase, { provider: PROVIDER_KEY, limit });
      return logs;
    },
  };
}
