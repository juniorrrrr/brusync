import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { MAX_SYNC_ATTEMPTS, nextAttemptAt } from "@/domain/integrations/syncBackoff";
import {
  getGoogleAdsAccountById,
  setGoogleAdsAccountStatus,
} from "@/repositories/googleAds/accountsRepository";
import { upsertGoogleAdsCampaigns } from "@/repositories/googleAds/campaignsRepository";
import { upsertGoogleAdsInsights } from "@/repositories/googleAds/insightsRepository";
import { upsertGoogleAdsKeywords } from "@/repositories/googleAds/keywordsRepository";
import {
  countQueuedIntegrationSyncJobs,
  enqueueIntegrationSyncJob,
  listDueIntegrationSyncJobs,
  listRecentIntegrationSyncJobs,
  markIntegrationSyncJobFailed,
  markIntegrationSyncJobRunning,
  markIntegrationSyncJobSucceeded,
} from "@/repositories/integrations/integrationSyncJobsRepository";
import { getIntegrationByProvider } from "@/repositories/integrations/integrationsRepository";
import { getDecryptedGoogleAdsAccessToken } from "@/services/googleAds/googleAdsAccountService";
import { getGoogleAdsProvider } from "@/services/googleAds/googleAdsProviderFactory";
import { reflectSyncOutcome } from "@/services/integrationsCenter/reflectSyncOutcome";
import type { IntegrationSyncJob } from "@/types/integrations";

const PROVIDER = "google_ads";
const INITIAL_SYNC_DAYS = 30;
const INCREMENTAL_SYNC_DAYS = 3;

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function microsToMoney(micros: number): number {
  return Math.round((micros / 1_000_000) * 100) / 100;
}

async function runSync(
  supabase: SupabaseClient,
  accountId: string,
  sinceDays: number,
): Promise<Record<string, number>> {
  const accessToken = await getDecryptedGoogleAdsAccessToken();
  if (!accessToken) throw new Error("Nenhum Access Token salvo para esta conta.");

  const account = await getGoogleAdsAccountById(supabase, accountId);
  if (!account) throw new Error("Conta do Google Ads não encontrada.");

  const provider = getGoogleAdsProvider();
  const credentials = { accessToken };

  const remoteCampaigns = await provider.listCampaigns(credentials, account.customerId);
  await upsertGoogleAdsCampaigns(
    supabase,
    accountId,
    remoteCampaigns.map((c) => ({
      campaignId: c.campaignId,
      name: c.name,
      channelType: c.channelType,
      status: (c.status as "ENABLED" | "PAUSED" | "REMOVED") ?? "UNKNOWN",
      budgetAmount: c.budgetAmountMicros !== null ? microsToMoney(c.budgetAmountMicros) : null,
    })),
  );

  const { data: campaignRows, error: campaignError } = await supabase
    .from("google_ads_campaigns")
    .select("id, campaign_id")
    .eq("account_id", accountId);
  if (campaignError)
    throw new Error(`Falha ao carregar campanhas salvas: ${campaignError.message}`);
  const campaignInternalIdByExternal = new Map(
    ((campaignRows ?? []) as { id: string; campaign_id: string }[]).map((row) => [
      row.campaign_id,
      row.id,
    ]),
  );

  let keywordCount = 0;
  for (const campaign of remoteCampaigns) {
    const internalId = campaignInternalIdByExternal.get(campaign.campaignId);
    if (!internalId) continue;
    const remoteKeywords = await provider.listKeywords(
      credentials,
      account.customerId,
      campaign.campaignId,
    );
    keywordCount += remoteKeywords.length;
    await upsertGoogleAdsKeywords(
      supabase,
      internalId,
      remoteKeywords.map((k) => ({
        keywordId: k.keywordId,
        adGroupName: k.adGroupName,
        text: k.text,
        matchType: k.matchType,
        status: k.status,
        clicks: k.clicks,
        impressions: k.impressions,
        cost: microsToMoney(k.costMicros),
      })),
    );
  }

  const since = isoDaysAgo(sinceDays);
  const until = todayIso();
  const remoteMetrics = await provider.fetchDailyMetrics(credentials, account.customerId, {
    since,
    until,
  });

  const byDate = new Map<
    string,
    {
      impressions: number;
      clicks: number;
      costMicros: number;
      conversions: number;
      conversionsValue: number;
    }
  >();
  for (const row of remoteMetrics) {
    const acc = byDate.get(row.date) ?? {
      impressions: 0,
      clicks: 0,
      costMicros: 0,
      conversions: 0,
      conversionsValue: 0,
    };
    acc.impressions += row.impressions;
    acc.clicks += row.clicks;
    acc.costMicros += row.costMicros;
    acc.conversions += row.conversions;
    acc.conversionsValue += row.conversionsValue;
    byDate.set(row.date, acc);
  }

  await upsertGoogleAdsInsights(
    supabase,
    accountId,
    [...byDate.entries()].map(([date, totals]) => ({
      campaignId: null,
      date,
      impressions: totals.impressions,
      clicks: totals.clicks,
      cost: microsToMoney(totals.costMicros),
      conversions: totals.conversions,
      conversionsValue: microsToMoney(totals.conversionsValue),
    })),
  );

  return { campaigns: remoteCampaigns.length, keywords: keywordCount, insightDays: byDate.size };
}

/** Processa um job da fila — mesmo padrão de
 * services/metaAds/metaAdsSyncService.ts::processSyncJob (Fase 29/34), só
 * que sobre a fila genérica (public.integration_sync_jobs, Fase 35) em vez
 * de uma tabela própria. */
export async function processSyncJob(
  supabase: SupabaseClient,
  job: IntegrationSyncJob,
): Promise<void> {
  await markIntegrationSyncJobRunning(supabase, job.id);
  const startedAt = Date.now();

  const accountId = (job.stats as { accountId?: string }).accountId;
  if (!accountId) {
    await markIntegrationSyncJobFailed(
      supabase,
      job.id,
      job.attempts + 1,
      nextAttemptAt(job.attempts + 1),
      "Job sem conta associada.",
    );
    return;
  }

  try {
    const sinceDays = job.jobType === "full" ? INITIAL_SYNC_DAYS : INCREMENTAL_SYNC_DAYS;
    const stats = await runSync(supabase, accountId, sinceDays);
    await markIntegrationSyncJobSucceeded(supabase, job.id, stats);
    await setGoogleAdsAccountStatus(supabase, accountId, "conectado");

    const recentJobs = await listRecentIntegrationSyncJobs(supabase, PROVIDER, 10);
    await reflectSyncOutcome(supabase, {
      provider: PROVIDER,
      outcome: "success",
      message: `Sincronização (${job.jobType}) concluída.`,
      durationMs: Date.now() - startedAt,
      recentOutcomes: recentJobs
        .filter((j) => j.status === "concluido" || j.status === "falhou")
        .map((j) => (j.status === "concluido" ? "success" : "error")),
      markErrored: false,
    });
  } catch (error) {
    const attempts = job.attempts + 1;
    const message = error instanceof Error ? error.message : "Falha desconhecida na sincronização.";
    await markIntegrationSyncJobFailed(
      supabase,
      job.id,
      attempts,
      nextAttemptAt(attempts),
      message,
    );
    const exhaustedRetries = attempts >= MAX_SYNC_ATTEMPTS;
    if (exhaustedRetries)
      await setGoogleAdsAccountStatus(supabase, accountId, "erro", { error: message });

    const recentJobs = await listRecentIntegrationSyncJobs(supabase, PROVIDER, 10);
    await reflectSyncOutcome(supabase, {
      provider: PROVIDER,
      outcome: "error",
      message,
      durationMs: Date.now() - startedAt,
      recentOutcomes: recentJobs
        .filter((j) => j.status === "concluido" || j.status === "falhou")
        .map((j) => (j.status === "concluido" ? "success" : "error")),
      markErrored: exhaustedRetries,
    });
  }
}

export async function processDueSyncJobs(supabase: SupabaseClient): Promise<number> {
  const jobs = await listDueIntegrationSyncJobs(supabase, PROVIDER);
  for (const job of jobs) await processSyncJob(supabase, job);
  return jobs.length;
}

export async function enqueueDailyIncrementalJobs(supabase: SupabaseClient): Promise<number> {
  const { data, error } = await supabase
    .from("google_ads_accounts")
    .select("id")
    .eq("is_synced", true);
  if (error) throw new Error(`Falha ao listar contas conectadas: ${error.message}`);

  const integration = await getIntegrationByProvider(supabase, PROVIDER);
  let enqueued = 0;
  for (const row of (data ?? []) as { id: string }[]) {
    await enqueueIntegrationSyncJob(supabase, {
      integrationId: integration?.id ?? null,
      provider: PROVIDER,
      jobType: "insights",
      triggerSource: "automatico",
      createdBy: null,
      initialStats: { accountId: row.id },
    });
    enqueued += 1;
  }
  return enqueued;
}

export async function enqueueManualSync(
  supabase: SupabaseClient,
  accountId: string,
  actorProfileId: string | null,
): Promise<IntegrationSyncJob> {
  const integration = await getIntegrationByProvider(supabase, PROVIDER);
  return enqueueIntegrationSyncJob(supabase, {
    integrationId: integration?.id ?? null,
    provider: PROVIDER,
    jobType: "full",
    triggerSource: "manual",
    createdBy: actorProfileId,
    initialStats: { accountId },
  });
}

export async function countQueuedGoogleAdsJobs(supabase: SupabaseClient): Promise<number> {
  return countQueuedIntegrationSyncJobs(supabase, PROVIDER);
}
