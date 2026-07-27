import "server-only";

import type {
  IntegrationProvider,
  IntegrationSelectableEntity,
  IntegrationStatusSnapshot,
} from "@/domain/integrations/provider";
import { CONNECTION_NOT_IMPLEMENTED_MESSAGE } from "@/domain/integrationsCenter/logEvents";
import { getDemoGa4Property } from "@/lib/demo/mockGa4";
import {
  getGa4PropertyById,
  listUnselectedGa4Properties,
} from "@/repositories/ga4/propertiesRepository";
import { getCurrentGa4TokenSecret } from "@/repositories/ga4/tokensRepository";
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
  disconnectGa4Property,
  getGa4Property,
  selectGa4Property,
} from "@/services/ga4/ga4AccountService";
import { getGa4Provider } from "@/services/ga4/ga4ProviderFactory";
import { enqueueManualSync, processSyncJob } from "@/services/ga4/ga4SyncService";
import { decryptSecret } from "@/services/security/tokenCrypto";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type { IntegrationLog } from "@/types/integrations";

const PROVIDER_KEY = "ga4";
const TOKEN_KEY_ENV_VAR = "GOOGLE_TOKEN_ENCRYPTION_KEY";

export function createGa4IntegrationProvider(): IntegrationProvider {
  return {
    key: PROVIDER_KEY,
    isImplemented: () => true,
    getManageUrl: () => null,
    getConnectUrl: () => "/api/ga4/oauth/start",

    async needsEntitySelection() {
      if (await isDemoModeActive()) return false;
      const supabase = await getSupabaseAuthClient();
      const [token, property] = await Promise.all([
        getCurrentGa4TokenSecret(supabase),
        getGa4Property(),
      ]);
      return Boolean(token) && !property;
    },

    async listSelectableEntities(): Promise<IntegrationSelectableEntity[]> {
      const supabase = await getSupabaseAuthClient();
      const properties = await listUnselectedGa4Properties(supabase);
      return properties.map((property) => ({
        id: property.id,
        label: property.displayName ?? property.propertyId,
        meta: `Property ID ${property.propertyId}`,
      }));
    },

    async selectEntity(entityId: string) {
      await selectGa4Property(entityId, null);
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
        const demo = getDemoGa4Property();
        return {
          ...empty,
          status: demo.status,
          healthScore: 90,
          lastSyncAt: demo.lastSyncAt,
          tokenExpiresAt: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString(),
        };
      }

      const supabase = await getSupabaseAuthClient();
      const [integration, property] = await Promise.all([
        getIntegrationByProvider(supabase, PROVIDER_KEY),
        getGa4Property(),
      ]);
      if (!integration) return empty;
      if (!property) return { ...empty, status: integration.status, error: integration.error };

      const [tokenSecret, recentJobs, queuedJobs] = await Promise.all([
        getCurrentGa4TokenSecret(supabase),
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

      const property = await getGa4Property();
      if (!property) return { ok: false, message: "Nenhuma propriedade conectada." };

      const supabase = await getSupabaseAuthClient();
      const tokenSecret = await getCurrentGa4TokenSecret(supabase);
      if (!tokenSecret)
        return { ok: false, message: "Nenhum Access Token salvo para esta propriedade." };

      const accessToken = decryptSecret(
        tokenSecret.access_token_ciphertext,
        tokenSecret.access_token_iv,
        TOKEN_KEY_ENV_VAR,
      );
      const validation = await getGa4Provider().validateToken({ accessToken });

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
            "Sincronização simulada concluída — 30 dias de métricas, aquisição e dispositivos atualizados. Nenhuma chamada real foi feita (Modo Demonstração).",
        };
      }

      const property = await getGa4Property();
      if (!property) return { ok: false, message: "Nenhuma propriedade conectada." };

      const supabase = await getSupabaseAuthClient();
      try {
        const job = await enqueueManualSync(supabase, property.id, actorProfileId);
        await processSyncJob(supabase, job);
        const refreshed = await getGa4PropertyById(supabase, property.id);
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
      const property = await getGa4Property();
      if (property) await disconnectGa4Property(property.id);
    },

    async getRecentLogs(limit = 20): Promise<IntegrationLog[]> {
      if (await isDemoModeActive()) return [];
      const supabase = await getSupabaseAuthClient();
      const { logs } = await listIntegrationLogs(supabase, { provider: PROVIDER_KEY, limit });
      return logs;
    },
  };
}
