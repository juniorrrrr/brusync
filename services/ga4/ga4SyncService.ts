import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { MAX_SYNC_ATTEMPTS, nextAttemptAt } from "@/domain/integrations/syncBackoff";
import { replaceGa4DimensionBreakdown } from "@/repositories/ga4/dimensionBreakdownRepository";
import { upsertGa4DailyMetrics } from "@/repositories/ga4/metricsRepository";
import { getGa4PropertyById, setGa4PropertyStatus } from "@/repositories/ga4/propertiesRepository";
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
import { getDecryptedGa4AccessToken } from "@/services/ga4/ga4AccountService";
import { getGa4Provider } from "@/services/ga4/ga4ProviderFactory";
import { reflectSyncOutcome } from "@/services/integrationsCenter/reflectSyncOutcome";
import type { IntegrationSyncJob } from "@/types/integrations";

const PROVIDER = "ga4";
const INITIAL_SYNC_DAYS = 30;
const INCREMENTAL_SYNC_DAYS = 3;

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}
function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

async function runSync(
  supabase: SupabaseClient,
  propertyRowId: string,
  sinceDays: number,
): Promise<Record<string, number>> {
  const accessToken = await getDecryptedGa4AccessToken();
  if (!accessToken) throw new Error("Nenhum Access Token salvo para esta propriedade.");

  const property = await getGa4PropertyById(supabase, propertyRowId);
  if (!property) throw new Error("Propriedade do GA4 não encontrada.");

  const provider = getGa4Provider();
  const credentials = { accessToken };
  const range = { since: isoDaysAgo(sinceDays), until: todayIso() };

  const overview = await provider.runOverviewReport(credentials, property.propertyId, range);
  await upsertGa4DailyMetrics(
    supabase,
    propertyRowId,
    overview.map((row) => ({
      date: row.date,
      sessions: row.sessions,
      users: row.users,
      newUsers: row.newUsers,
      engagedSessions: row.engagedSessions,
      engagementRate: row.engagementRate,
      pageViews: row.pageViews,
      conversions: row.conversions,
      revenue: row.revenue,
    })),
  );

  const channels = await provider.runChannelBreakdownReport(
    credentials,
    property.propertyId,
    range,
  );
  await replaceGa4DimensionBreakdown(
    supabase,
    propertyRowId,
    "channel",
    channels.map((row) => ({
      date: row.date,
      dimensionValue: row.dimensionValue,
      sessions: row.sessions,
      users: row.users,
      conversions: row.conversions,
    })),
  );

  const devices = await provider.runDeviceBreakdownReport(credentials, property.propertyId, range);
  await replaceGa4DimensionBreakdown(
    supabase,
    propertyRowId,
    "device",
    devices.map((row) => ({
      date: row.date,
      dimensionValue: row.dimensionValue,
      sessions: row.sessions,
      users: row.users,
      conversions: row.conversions,
    })),
  );

  return { overviewDays: overview.length, channels: channels.length, devices: devices.length };
}

export async function processSyncJob(
  supabase: SupabaseClient,
  job: IntegrationSyncJob,
): Promise<void> {
  await markIntegrationSyncJobRunning(supabase, job.id);
  const startedAt = Date.now();

  const propertyRowId = (job.stats as { propertyId?: string }).propertyId;
  if (!propertyRowId) {
    await markIntegrationSyncJobFailed(
      supabase,
      job.id,
      job.attempts + 1,
      nextAttemptAt(job.attempts + 1),
      "Job sem propriedade associada.",
    );
    return;
  }

  try {
    const sinceDays = job.jobType === "full" ? INITIAL_SYNC_DAYS : INCREMENTAL_SYNC_DAYS;
    const stats = await runSync(supabase, propertyRowId, sinceDays);
    await markIntegrationSyncJobSucceeded(supabase, job.id, stats);
    await setGa4PropertyStatus(supabase, propertyRowId, "conectado");

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
      await setGa4PropertyStatus(supabase, propertyRowId, "erro", { error: message });

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
  const { data, error } = await supabase.from("ga4_properties").select("id").eq("is_synced", true);
  if (error) throw new Error(`Falha ao listar propriedades conectadas: ${error.message}`);

  const integration = await getIntegrationByProvider(supabase, PROVIDER);
  let enqueued = 0;
  for (const row of (data ?? []) as { id: string }[]) {
    await enqueueIntegrationSyncJob(supabase, {
      integrationId: integration?.id ?? null,
      provider: PROVIDER,
      jobType: "metrics",
      triggerSource: "automatico",
      createdBy: null,
      initialStats: { propertyId: row.id },
    });
    enqueued += 1;
  }
  return enqueued;
}

export async function enqueueManualSync(
  supabase: SupabaseClient,
  propertyRowId: string,
  actorProfileId: string | null,
): Promise<IntegrationSyncJob> {
  const integration = await getIntegrationByProvider(supabase, PROVIDER);
  return enqueueIntegrationSyncJob(supabase, {
    integrationId: integration?.id ?? null,
    provider: PROVIDER,
    jobType: "full",
    triggerSource: "manual",
    createdBy: actorProfileId,
    initialStats: { propertyId: propertyRowId },
  });
}

export async function countQueuedGa4Jobs(supabase: SupabaseClient): Promise<number> {
  return countQueuedIntegrationSyncJobs(supabase, PROVIDER);
}
