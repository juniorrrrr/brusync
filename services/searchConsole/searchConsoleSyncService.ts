import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { MAX_SYNC_ATTEMPTS, nextAttemptAt } from "@/domain/integrations/syncBackoff";
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
import { replaceSearchConsolePages } from "@/repositories/searchConsole/pagesRepository";
import { replaceSearchConsoleQueries } from "@/repositories/searchConsole/queriesRepository";
import { upsertSearchConsoleSitemaps } from "@/repositories/searchConsole/sitemapsRepository";
import {
  getSearchConsoleSiteById,
  setSearchConsoleSiteStatus,
} from "@/repositories/searchConsole/sitesRepository";
import { reflectSyncOutcome } from "@/services/integrationsCenter/reflectSyncOutcome";
import { getDecryptedSearchConsoleAccessToken } from "@/services/searchConsole/searchConsoleAccountService";
import { getSearchConsoleProvider } from "@/services/searchConsole/searchConsoleProviderFactory";
import type { IntegrationSyncJob } from "@/types/integrations";

const PROVIDER = "search_console";
const WINDOW_DAYS = 28;

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}
function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

async function runSync(
  supabase: SupabaseClient,
  siteRowId: string,
): Promise<Record<string, number>> {
  const accessToken = await getDecryptedSearchConsoleAccessToken();
  if (!accessToken) throw new Error("Nenhum Access Token salvo para este site.");

  const site = await getSearchConsoleSiteById(supabase, siteRowId);
  if (!site) throw new Error("Site do Search Console não encontrado.");

  const provider = getSearchConsoleProvider();
  const credentials = { accessToken };
  const range = { since: isoDaysAgo(WINDOW_DAYS), until: todayIso() };

  const [queryRows, pageRows, sitemaps] = await Promise.all([
    provider.queryAnalytics(credentials, site.siteUrl, "query", range),
    provider.queryAnalytics(credentials, site.siteUrl, "page", range),
    provider.listSitemaps(credentials, site.siteUrl),
  ]);

  await replaceSearchConsoleQueries(
    supabase,
    siteRowId,
    range.since,
    range.until,
    queryRows.map((row) => ({
      query: row.key,
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position,
    })),
  );

  await replaceSearchConsolePages(
    supabase,
    siteRowId,
    range.since,
    range.until,
    pageRows.map((row) => ({
      pageUrl: row.key,
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position,
    })),
  );

  await upsertSearchConsoleSitemaps(
    supabase,
    siteRowId,
    sitemaps.map((s) => ({
      sitemapUrl: s.path,
      isPending: s.isPending,
      errorsCount: s.errors,
      warningsCount: s.warnings,
      submittedAt: s.lastSubmitted,
      lastDownloadedAt: s.lastDownloaded,
    })),
  );

  return { queries: queryRows.length, pages: pageRows.length, sitemaps: sitemaps.length };
}

export async function processSyncJob(
  supabase: SupabaseClient,
  job: IntegrationSyncJob,
): Promise<void> {
  await markIntegrationSyncJobRunning(supabase, job.id);
  const startedAt = Date.now();

  const siteRowId = (job.stats as { siteId?: string }).siteId;
  if (!siteRowId) {
    await markIntegrationSyncJobFailed(
      supabase,
      job.id,
      job.attempts + 1,
      nextAttemptAt(job.attempts + 1),
      "Job sem site associado.",
    );
    return;
  }

  try {
    const stats = await runSync(supabase, siteRowId);
    await markIntegrationSyncJobSucceeded(supabase, job.id, stats);
    await setSearchConsoleSiteStatus(supabase, siteRowId, "conectado");

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
      await setSearchConsoleSiteStatus(supabase, siteRowId, "erro", { error: message });

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
    .from("search_console_sites")
    .select("id")
    .eq("is_synced", true);
  if (error) throw new Error(`Falha ao listar sites conectados: ${error.message}`);

  const integration = await getIntegrationByProvider(supabase, PROVIDER);
  let enqueued = 0;
  for (const row of (data ?? []) as { id: string }[]) {
    await enqueueIntegrationSyncJob(supabase, {
      integrationId: integration?.id ?? null,
      provider: PROVIDER,
      jobType: "queries",
      triggerSource: "automatico",
      createdBy: null,
      initialStats: { siteId: row.id },
    });
    enqueued += 1;
  }
  return enqueued;
}

export async function enqueueManualSync(
  supabase: SupabaseClient,
  siteRowId: string,
  actorProfileId: string | null,
): Promise<IntegrationSyncJob> {
  const integration = await getIntegrationByProvider(supabase, PROVIDER);
  return enqueueIntegrationSyncJob(supabase, {
    integrationId: integration?.id ?? null,
    provider: PROVIDER,
    jobType: "full",
    triggerSource: "manual",
    createdBy: actorProfileId,
    initialStats: { siteId: siteRowId },
  });
}

export async function countQueuedSearchConsoleJobs(supabase: SupabaseClient): Promise<number> {
  return countQueuedIntegrationSyncJobs(supabase, PROVIDER);
}
