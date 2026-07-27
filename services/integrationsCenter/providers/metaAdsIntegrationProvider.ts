import "server-only";

import { computeHealthScore } from "@/domain/integrations/health";
import type {
  IntegrationProvider,
  IntegrationStatusSnapshot,
} from "@/domain/integrations/provider";
import { CONNECTION_NOT_IMPLEMENTED_MESSAGE } from "@/domain/integrationsCenter/logEvents";
import { getDemoIntegrationLogs } from "@/lib/demo/mockIntegrations";
import { getDemoMetaAdsSettingsPageData } from "@/lib/demo/mockMetaAds";
import {
  createIntegrationLog,
  listIntegrationLogs,
} from "@/repositories/integrations/integrationLogsRepository";
import {
  getIntegrationByProvider,
  updateIntegration,
} from "@/repositories/integrations/integrationsRepository";
import { getActiveMetaAccount } from "@/repositories/metaAds/accountsRepository";
import { countQueuedJobs, listRecentJobs } from "@/repositories/metaAds/syncJobsRepository";
import { getCurrentTokenSecret } from "@/repositories/metaAds/tokensRepository";
import { isDemoModeActive } from "@/services/demo/demoMode";
import {
  disconnectMetaAdsAccount,
  getMetaAdsAccount,
} from "@/services/metaAds/metaAdsAccountService";
import { getMetaAdsProvider } from "@/services/metaAds/metaAdsProviderFactory";
import { enqueueManualSync, processSyncJob } from "@/services/metaAds/metaAdsSyncService";
import { decryptToken } from "@/services/metaConversionsApi/tokenCrypto";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type { IntegrationLog } from "@/types/integrations";

const PROVIDER_KEY = "meta_ads_manager";
const MANAGE_URL = "/meta-ads/configuracoes";

/** Marketing API oficial (Fase 29) por trás do IntegrationProvider genérico
 * (Fase 34) — todo método aqui só reorganiza chamadas que já existiam em
 * services/metaAds/*; nenhuma regra de sincronização/OAuth foi reescrita. */
export function createMetaAdsIntegrationProvider(): IntegrationProvider {
  return {
    key: PROVIDER_KEY,

    isImplemented: () => true,

    getManageUrl: () => MANAGE_URL,

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
        const demo = getDemoMetaAdsSettingsPageData();
        if (!demo.account) return empty;
        const finished = demo.recentJobs.filter((j) => j.status === "concluido");
        return {
          status: demo.account.status,
          healthScore: computeHealthScore(
            demo.recentJobs
              .filter((j) => j.status === "concluido" || j.status === "falhou")
              .map((j) => (j.status === "concluido" ? "success" : "error")),
          ),
          lastSyncAt: demo.account.lastSyncAt,
          nextSyncAt: null,
          tokenExpiresAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
          queuedJobs: demo.recentJobs.filter(
            (j) => j.status === "pendente" || j.status === "executando",
          ).length,
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
          error: demo.account.error,
        };
      }

      const supabase = await getSupabaseAuthClient();
      const [integration, account] = await Promise.all([
        getIntegrationByProvider(supabase, PROVIDER_KEY),
        getActiveMetaAccount(supabase),
      ]);
      if (!integration) return empty;
      if (!account) {
        return {
          ...empty,
          status: integration.status,
          healthScore: integration.healthScore,
          error: integration.error,
        };
      }

      const [tokenSecret, recentJobs, queuedJobs] = await Promise.all([
        getCurrentTokenSecret(supabase, account.id),
        listRecentJobs(supabase, account.id, 10),
        countQueuedJobs(supabase, account.id),
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
      if (await isDemoModeActive()) {
        return { ok: false, message: CONNECTION_NOT_IMPLEMENTED_MESSAGE };
      }

      const supabase = await getSupabaseAuthClient();
      const integration = await getIntegrationByProvider(supabase, PROVIDER_KEY);
      const account = await getActiveMetaAccount(supabase);
      if (!account) {
        return {
          ok: false,
          message: "Nenhuma conta conectada — conecte em Meta Ads → Configurações.",
        };
      }
      const tokenSecret = await getCurrentTokenSecret(supabase, account.id);
      if (!tokenSecret) {
        return { ok: false, message: "Nenhum Access Token salvo para esta conta." };
      }
      const accessToken = decryptToken(
        tokenSecret.access_token_ciphertext,
        tokenSecret.access_token_iv,
      );
      const validation = await getMetaAdsProvider().validateToken({ accessToken });

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
        const demo = getDemoMetaAdsSettingsPageData();
        const campaigns = demo.recentJobs.reduce(
          (sum, j) => sum + (typeof j.stats.campaigns === "number" ? j.stats.campaigns : 0),
          0,
        );
        return {
          ok: true,
          message: `Sincronização simulada concluída — ${demo.adAccounts.length} contas de anúncio, ${campaigns || 5} campanhas atualizadas. Nenhuma chamada real foi feita (Modo Demonstração).`,
        };
      }

      const account = await getMetaAdsAccount();
      if (!account) {
        return {
          ok: false,
          message: "Nenhuma conta conectada — conecte em Meta Ads → Configurações.",
        };
      }

      const supabase = await getSupabaseAuthClient();
      try {
        const job = await enqueueManualSync(supabase, account.id, actorProfileId);
        await processSyncJob(supabase, job);

        const refreshed = await getActiveMetaAccount(supabase);
        if (refreshed?.status === "erro") {
          return { ok: false, message: refreshed.error ?? "Falha ao sincronizar." };
        }
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

      const account = await getMetaAdsAccount();
      if (!account) return;

      await disconnectMetaAdsAccount(account.id);

      const supabase = await getSupabaseAuthClient();
      const integration = await getIntegrationByProvider(supabase, PROVIDER_KEY);
      if (!integration) return;

      await updateIntegration(supabase, PROVIDER_KEY, {
        status: "desconectado",
        enabled: false,
        error: null,
      });
      await createIntegrationLog(supabase, {
        integrationId: integration.id,
        event: "conexao_removida",
        status: "success",
        message: "Conta desconectada pelo usuário.",
        origin: "crm",
        destination: PROVIDER_KEY,
      });
    },

    async getRecentLogs(limit = 20): Promise<IntegrationLog[]> {
      if (await isDemoModeActive()) {
        return getDemoIntegrationLogs()
          .filter((log) => log.integrationProvider === PROVIDER_KEY)
          .slice(0, limit);
      }
      const supabase = await getSupabaseAuthClient();
      const { logs } = await listIntegrationLogs(supabase, { provider: PROVIDER_KEY, limit });
      return logs;
    },
  };
}
