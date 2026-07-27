import "server-only";

import type {
  IntegrationProvider,
  IntegrationSelectableEntity,
  IntegrationStatusSnapshot,
} from "@/domain/integrations/provider";
import { CONNECTION_NOT_IMPLEMENTED_MESSAGE } from "@/domain/integrationsCenter/logEvents";
import { getDemoGtmContainer } from "@/lib/demo/mockGtm";
import {
  getGtmContainerById,
  listUnselectedGtmContainers,
} from "@/repositories/googleTagManager/containersRepository";
import { getCurrentGtmTokenSecret } from "@/repositories/googleTagManager/tokensRepository";
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
  disconnectGtmContainer,
  getGtmContainer,
  selectGtmContainer,
} from "@/services/googleTagManager/gtmAccountService";
import { getGtmProvider } from "@/services/googleTagManager/gtmProviderFactory";
import { enqueueManualSync, processSyncJob } from "@/services/googleTagManager/gtmSyncService";
import { decryptSecret } from "@/services/security/tokenCrypto";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type { IntegrationLog } from "@/types/integrations";

const PROVIDER_KEY = "gtm";
const TOKEN_KEY_ENV_VAR = "GOOGLE_TOKEN_ENCRYPTION_KEY";

export function createGoogleTagManagerIntegrationProvider(): IntegrationProvider {
  return {
    key: PROVIDER_KEY,
    isImplemented: () => true,
    getManageUrl: () => null,
    getConnectUrl: () => "/api/google-tag-manager/oauth/start",

    async needsEntitySelection() {
      if (await isDemoModeActive()) return false;
      const supabase = await getSupabaseAuthClient();
      const [token, container] = await Promise.all([
        getCurrentGtmTokenSecret(supabase),
        getGtmContainer(),
      ]);
      return Boolean(token) && !container;
    },

    async listSelectableEntities(): Promise<IntegrationSelectableEntity[]> {
      const supabase = await getSupabaseAuthClient();
      const containers = await listUnselectedGtmContainers(supabase);
      return containers.map((container) => ({
        id: container.id,
        label: container.name ?? container.publicId ?? container.containerId,
        meta: container.publicId ?? undefined,
      }));
    },

    async selectEntity(entityId: string) {
      await selectGtmContainer(entityId, null);
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
        const demo = getDemoGtmContainer();
        return {
          ...empty,
          status: demo.status,
          healthScore: 96,
          lastSyncAt: demo.lastSyncAt,
          tokenExpiresAt: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString(),
        };
      }

      const supabase = await getSupabaseAuthClient();
      const [integration, container] = await Promise.all([
        getIntegrationByProvider(supabase, PROVIDER_KEY),
        getGtmContainer(),
      ]);
      if (!integration) return empty;
      if (!container) return { ...empty, status: integration.status, error: integration.error };

      const [tokenSecret, recentJobs, queuedJobs] = await Promise.all([
        getCurrentGtmTokenSecret(supabase),
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

      const container = await getGtmContainer();
      if (!container) return { ok: false, message: "Nenhum container conectado." };

      const supabase = await getSupabaseAuthClient();
      const tokenSecret = await getCurrentGtmTokenSecret(supabase);
      if (!tokenSecret)
        return { ok: false, message: "Nenhum Access Token salvo para este container." };

      const accessToken = decryptSecret(
        tokenSecret.access_token_ciphertext,
        tokenSecret.access_token_iv,
        TOKEN_KEY_ENV_VAR,
      );
      const validation = await getGtmProvider().validateToken({ accessToken });

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
            "Sincronização simulada concluída — 1 workspace, 8 tags, 5 triggers, 4 variables atualizados. Nenhuma chamada real foi feita (Modo Demonstração).",
        };
      }

      const container = await getGtmContainer();
      if (!container) return { ok: false, message: "Nenhum container conectado." };

      const supabase = await getSupabaseAuthClient();
      try {
        const job = await enqueueManualSync(supabase, container.id, actorProfileId);
        await processSyncJob(supabase, job);
        const refreshed = await getGtmContainerById(supabase, container.id);
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
      const container = await getGtmContainer();
      if (container) await disconnectGtmContainer(container.id);
    },

    async getRecentLogs(limit = 20): Promise<IntegrationLog[]> {
      if (await isDemoModeActive()) return [];
      const supabase = await getSupabaseAuthClient();
      const { logs } = await listIntegrationLogs(supabase, { provider: PROVIDER_KEY, limit });
      return logs;
    },
  };
}
