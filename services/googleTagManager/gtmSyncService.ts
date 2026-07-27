import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { MAX_SYNC_ATTEMPTS, nextAttemptAt } from "@/domain/integrations/syncBackoff";
import {
  getGtmContainerById,
  setGtmContainerStatus,
} from "@/repositories/googleTagManager/containersRepository";
import { upsertGtmEntities } from "@/repositories/googleTagManager/entitiesRepository";
import { upsertGtmVersions } from "@/repositories/googleTagManager/versionsRepository";
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
import { getDecryptedGtmAccessToken } from "@/services/googleTagManager/gtmAccountService";
import { getGtmProvider } from "@/services/googleTagManager/gtmProviderFactory";
import { reflectSyncOutcome } from "@/services/integrationsCenter/reflectSyncOutcome";
import type { IntegrationSyncJob } from "@/types/integrations";

const PROVIDER = "gtm";

async function runSync(
  supabase: SupabaseClient,
  containerRowId: string,
): Promise<Record<string, number>> {
  const accessToken = await getDecryptedGtmAccessToken();
  if (!accessToken) throw new Error("Nenhum Access Token salvo para este container.");

  const container = await getGtmContainerById(supabase, containerRowId);
  if (!container?.accountIdExternal) throw new Error("Container do GTM não encontrado.");

  const provider = getGtmProvider();
  const credentials = { accessToken };

  const workspaces = await provider.listWorkspaces(
    credentials,
    container.accountIdExternal,
    container.containerId,
  );

  let tagCount = 0;
  let triggerCount = 0;
  let variableCount = 0;

  for (const workspace of workspaces) {
    await upsertGtmEntities(supabase, containerRowId, [
      {
        entityType: "workspace",
        externalId: workspace.workspaceId,
        workspaceExternalId: workspace.workspaceId,
        name: workspace.name,
        type: null,
        status: null,
      },
    ]);

    const [tags, triggers, variables] = await Promise.all([
      provider.listTags(
        credentials,
        container.accountIdExternal,
        container.containerId,
        workspace.workspaceId,
      ),
      provider.listTriggers(
        credentials,
        container.accountIdExternal,
        container.containerId,
        workspace.workspaceId,
      ),
      provider.listVariables(
        credentials,
        container.accountIdExternal,
        container.containerId,
        workspace.workspaceId,
      ),
    ]);

    tagCount += tags.length;
    triggerCount += triggers.length;
    variableCount += variables.length;

    await upsertGtmEntities(
      supabase,
      containerRowId,
      tags.map((t) => ({
        entityType: "tag" as const,
        externalId: t.externalId,
        workspaceExternalId: workspace.workspaceId,
        name: t.name,
        type: t.type,
        status: t.status,
      })),
    );
    await upsertGtmEntities(
      supabase,
      containerRowId,
      triggers.map((t) => ({
        entityType: "trigger" as const,
        externalId: t.externalId,
        workspaceExternalId: workspace.workspaceId,
        name: t.name,
        type: t.type,
        status: t.status,
      })),
    );
    await upsertGtmEntities(
      supabase,
      containerRowId,
      variables.map((v) => ({
        entityType: "variable" as const,
        externalId: v.externalId,
        workspaceExternalId: workspace.workspaceId,
        name: v.name,
        type: v.type,
        status: v.status,
      })),
    );
  }

  const versions = await provider.listVersions(
    credentials,
    container.accountIdExternal,
    container.containerId,
  );
  await upsertGtmVersions(
    supabase,
    containerRowId,
    versions.map((v) => ({
      versionExternalId: v.versionId,
      name: v.name,
      publishedAt: v.publishedAt,
    })),
  );

  return {
    workspaces: workspaces.length,
    tags: tagCount,
    triggers: triggerCount,
    variables: variableCount,
    versions: versions.length,
  };
}

export async function processSyncJob(
  supabase: SupabaseClient,
  job: IntegrationSyncJob,
): Promise<void> {
  await markIntegrationSyncJobRunning(supabase, job.id);
  const startedAt = Date.now();

  const containerRowId = (job.stats as { containerId?: string }).containerId;
  if (!containerRowId) {
    await markIntegrationSyncJobFailed(
      supabase,
      job.id,
      job.attempts + 1,
      nextAttemptAt(job.attempts + 1),
      "Job sem container associado.",
    );
    return;
  }

  try {
    const stats = await runSync(supabase, containerRowId);
    await markIntegrationSyncJobSucceeded(supabase, job.id, stats);
    await setGtmContainerStatus(supabase, containerRowId, "conectado");

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
      await setGtmContainerStatus(supabase, containerRowId, "erro", { error: message });

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
  const { data, error } = await supabase.from("gtm_containers").select("id").eq("is_synced", true);
  if (error) throw new Error(`Falha ao listar containers conectados: ${error.message}`);

  const integration = await getIntegrationByProvider(supabase, PROVIDER);
  let enqueued = 0;
  for (const row of (data ?? []) as { id: string }[]) {
    await enqueueIntegrationSyncJob(supabase, {
      integrationId: integration?.id ?? null,
      provider: PROVIDER,
      jobType: "entities",
      triggerSource: "automatico",
      createdBy: null,
      initialStats: { containerId: row.id },
    });
    enqueued += 1;
  }
  return enqueued;
}

export async function enqueueManualSync(
  supabase: SupabaseClient,
  containerRowId: string,
  actorProfileId: string | null,
): Promise<IntegrationSyncJob> {
  const integration = await getIntegrationByProvider(supabase, PROVIDER);
  return enqueueIntegrationSyncJob(supabase, {
    integrationId: integration?.id ?? null,
    provider: PROVIDER,
    jobType: "full",
    triggerSource: "manual",
    createdBy: actorProfileId,
    initialStats: { containerId: containerRowId },
  });
}

export async function countQueuedGtmJobs(supabase: SupabaseClient): Promise<number> {
  return countQueuedIntegrationSyncJobs(supabase, PROVIDER);
}
