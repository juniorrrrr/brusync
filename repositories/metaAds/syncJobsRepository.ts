import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { MAX_SYNC_ATTEMPTS } from "@/domain/metaAds/syncBackoff";
import type {
  MetaSyncJob,
  MetaSyncJobStatus,
  MetaSyncJobType,
  MetaSyncTriggerSource,
} from "@/types/metaAds";

interface SyncJobRow {
  id: string;
  account_id: string;
  ad_account_id: string | null;
  job_type: MetaSyncJobType;
  status: MetaSyncJobStatus;
  trigger_source: MetaSyncTriggerSource;
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
  id, account_id, ad_account_id, job_type, status, trigger_source, attempts, max_attempts,
  next_attempt_at, started_at, finished_at, error, stats, created_at, updated_at
`;

function mapJob(row: SyncJobRow): MetaSyncJob {
  return {
    id: row.id,
    accountId: row.account_id,
    adAccountId: row.ad_account_id,
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

export interface EnqueueJobPayload {
  accountId: string;
  adAccountId: string | null;
  jobType: MetaSyncJobType;
  triggerSource: MetaSyncTriggerSource;
  createdBy: string | null;
}

export async function enqueueSyncJob(
  supabase: SupabaseClient,
  payload: EnqueueJobPayload,
): Promise<MetaSyncJob> {
  const { data, error } = await supabase
    .from("meta_sync_jobs")
    .insert({
      account_id: payload.accountId,
      ad_account_id: payload.adAccountId,
      job_type: payload.jobType,
      trigger_source: payload.triggerSource,
      created_by: payload.createdBy,
      status: "pendente",
      next_attempt_at: new Date().toISOString(),
    })
    .select(JOB_SELECT)
    .single();

  if (error) throw new Error(`Falha ao enfileirar sincronização: ${error.message}`);
  return mapJob(data as SyncJobRow);
}

/** Jobs prontos para rodar agora — pendentes ou falhados com next_attempt_at
 * já vencido e attempts < max_attempts (mesmo espírito do
 * listDeliveriesForRetry usado pelo cron de conversões, Fase 8). */
export async function listDueSyncJobs(
  supabase: SupabaseClient,
  limit = 20,
): Promise<MetaSyncJob[]> {
  const { data, error } = await supabase
    .from("meta_sync_jobs")
    .select(JOB_SELECT)
    .in("status", ["pendente", "falhou"])
    .lte("next_attempt_at", new Date().toISOString())
    .lt("attempts", MAX_SYNC_ATTEMPTS)
    .order("next_attempt_at")
    .limit(limit);

  if (error) throw new Error(`Falha ao listar sincronizações pendentes: ${error.message}`);
  return ((data ?? []) as SyncJobRow[]).map(mapJob);
}

export async function markJobRunning(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase
    .from("meta_sync_jobs")
    .update({ status: "executando", started_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(`Falha ao iniciar job: ${error.message}`);
}

export async function markJobSucceeded(
  supabase: SupabaseClient,
  id: string,
  stats: Record<string, unknown>,
): Promise<void> {
  const { error } = await supabase
    .from("meta_sync_jobs")
    .update({ status: "concluido", finished_at: new Date().toISOString(), stats, error: null })
    .eq("id", id);
  if (error) throw new Error(`Falha ao concluir job: ${error.message}`);
}

export async function markJobFailed(
  supabase: SupabaseClient,
  id: string,
  attempts: number,
  nextAttemptAt: Date,
  errorMessage: string,
): Promise<void> {
  const { error } = await supabase
    .from("meta_sync_jobs")
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

export async function listRecentJobs(
  supabase: SupabaseClient,
  accountId: string,
  limit = 20,
): Promise<MetaSyncJob[]> {
  const { data, error } = await supabase
    .from("meta_sync_jobs")
    .select(JOB_SELECT)
    .eq("account_id", accountId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Falha ao carregar histórico de sincronizações: ${error.message}`);
  return ((data ?? []) as SyncJobRow[]).map(mapJob);
}

export async function listRecentFailedJobs(
  supabase: SupabaseClient,
  accountId: string,
  limit = 5,
): Promise<MetaSyncJob[]> {
  const { data, error } = await supabase
    .from("meta_sync_jobs")
    .select(JOB_SELECT)
    .eq("account_id", accountId)
    .eq("status", "falhou")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Falha ao carregar falhas de sincronização: ${error.message}`);
  return ((data ?? []) as SyncJobRow[]).map(mapJob);
}
