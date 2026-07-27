import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { MAX_SYNC_ATTEMPTS } from "@/domain/integrations/syncBackoff";
import type {
  IntegrationSyncJob,
  IntegrationSyncJobStatus,
  IntegrationSyncTriggerSource,
} from "@/types/integrations";

interface SyncJobRow {
  id: string;
  integration_id: string | null;
  provider: string;
  job_type: string;
  status: IntegrationSyncJobStatus;
  trigger_source: IntegrationSyncTriggerSource;
  attempts: number;
  max_attempts: number;
  next_attempt_at: string;
  started_at: string | null;
  finished_at: string | null;
  error: string | null;
  stats: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

const JOB_SELECT = `
  id, integration_id, provider, job_type, status, trigger_source, attempts, max_attempts,
  next_attempt_at, started_at, finished_at, error, stats, created_at, updated_at
`;

function mapJob(row: SyncJobRow): IntegrationSyncJob {
  return {
    id: row.id,
    integrationId: row.integration_id,
    provider: row.provider,
    jobType: row.job_type,
    status: row.status,
    triggerSource: row.trigger_source,
    attempts: row.attempts,
    maxAttempts: row.max_attempts,
    nextAttemptAt: row.next_attempt_at,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    error: row.error,
    stats: row.stats ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Generic sync job queue (public.integration_sync_jobs, Fase 35) — the
 * infrastructure Fase 34 said every future provider would reuse. Meta Ads
 * keeps its own meta_sync_jobs (repositories/metaAds/syncJobsRepository.ts)
 * untouched; every provider registered since (Google Ads, GA4, GTM, Search
 * Console, and whatever comes next) uses this one instead of adding a
 * near-identical table each time. */

export interface EnqueueIntegrationSyncJobPayload {
  integrationId: string | null;
  provider: string;
  jobType: string;
  triggerSource: IntegrationSyncTriggerSource;
  createdBy: string | null;
  /** The generic queue has no per-provider entity column (accountId/
   * propertyId/containerId/siteId) since it's shared by every provider —
   * a provider that syncs one entity at a time stashes its reference here
   * instead (e.g. `{ accountId: "..." }`), read back by its own
   * processSyncJob. */
  initialStats?: Record<string, unknown>;
}

export async function enqueueIntegrationSyncJob(
  supabase: SupabaseClient,
  payload: EnqueueIntegrationSyncJobPayload,
): Promise<IntegrationSyncJob> {
  const { data, error } = await supabase
    .from("integration_sync_jobs")
    .insert({
      integration_id: payload.integrationId,
      provider: payload.provider,
      job_type: payload.jobType,
      trigger_source: payload.triggerSource,
      created_by: payload.createdBy,
      status: "pendente",
      next_attempt_at: new Date().toISOString(),
      stats: payload.initialStats ?? {},
    })
    .select(JOB_SELECT)
    .single();

  if (error) throw new Error(`Falha ao enfileirar sincronização: ${error.message}`);
  return mapJob(data as SyncJobRow);
}

export async function listDueIntegrationSyncJobs(
  supabase: SupabaseClient,
  provider: string,
  limit = 20,
): Promise<IntegrationSyncJob[]> {
  const { data, error } = await supabase
    .from("integration_sync_jobs")
    .select(JOB_SELECT)
    .eq("provider", provider)
    .in("status", ["pendente", "falhou"])
    .lte("next_attempt_at", new Date().toISOString())
    .lt("attempts", MAX_SYNC_ATTEMPTS)
    .order("next_attempt_at")
    .limit(limit);

  if (error) throw new Error(`Falha ao listar sincronizações pendentes: ${error.message}`);
  return ((data ?? []) as SyncJobRow[]).map(mapJob);
}

export async function markIntegrationSyncJobRunning(
  supabase: SupabaseClient,
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from("integration_sync_jobs")
    .update({ status: "executando", started_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(`Falha ao iniciar job: ${error.message}`);
}

export async function markIntegrationSyncJobSucceeded(
  supabase: SupabaseClient,
  id: string,
  stats: Record<string, unknown>,
): Promise<void> {
  const { error } = await supabase
    .from("integration_sync_jobs")
    .update({ status: "concluido", finished_at: new Date().toISOString(), stats, error: null })
    .eq("id", id);
  if (error) throw new Error(`Falha ao concluir job: ${error.message}`);
}

export async function markIntegrationSyncJobFailed(
  supabase: SupabaseClient,
  id: string,
  attempts: number,
  nextAttemptAt: Date,
  errorMessage: string,
): Promise<void> {
  const { error } = await supabase
    .from("integration_sync_jobs")
    .update({
      status: "falhou",
      attempts,
      next_attempt_at: nextAttemptAt.toISOString(),
      finished_at: new Date().toISOString(),
      error: errorMessage,
    })
    .eq("id", id);
  if (error) throw new Error(`Falha ao registrar erro do job: ${error.message}`);
}

export async function listRecentIntegrationSyncJobs(
  supabase: SupabaseClient,
  provider: string,
  limit = 20,
): Promise<IntegrationSyncJob[]> {
  const { data, error } = await supabase
    .from("integration_sync_jobs")
    .select(JOB_SELECT)
    .eq("provider", provider)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Falha ao carregar histórico de sincronizações: ${error.message}`);
  return ((data ?? []) as SyncJobRow[]).map(mapJob);
}

export async function countQueuedIntegrationSyncJobs(
  supabase: SupabaseClient,
  provider: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("integration_sync_jobs")
    .select("id", { count: "exact", head: true })
    .eq("provider", provider)
    .in("status", ["pendente", "executando"]);

  if (error) throw new Error(`Falha ao contar sincronizações na fila: ${error.message}`);
  return count ?? 0;
}
