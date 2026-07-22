import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { IntegrationLog, IntegrationLogStatus } from "@/types/integrations";

interface IntegrationLogRow {
  id: string;
  integration_id: string | null;
  event: string;
  status: IntegrationLogStatus;
  message: string | null;
  payload: Record<string, unknown> | null;
  origin: string | null;
  destination: string | null;
  duration_ms: number | null;
  created_at: string;
  integrations: { name: string; provider: string } | { name: string; provider: string }[] | null;
}

function mapLog(row: IntegrationLogRow): IntegrationLog {
  const integration = Array.isArray(row.integrations) ? row.integrations[0] : row.integrations;
  return {
    id: row.id,
    integrationId: row.integration_id,
    integrationName: integration?.name ?? null,
    integrationProvider: integration?.provider ?? null,
    event: row.event,
    status: row.status,
    message: row.message,
    payload: row.payload,
    origin: row.origin,
    destination: row.destination,
    durationMs: row.duration_ms,
    createdAt: row.created_at,
  };
}

const LOG_SELECT =
  "id, integration_id, event, status, message, payload, origin, destination, duration_ms, created_at, integrations (name, provider)";

export interface ListIntegrationLogsOptions {
  provider?: string;
  status?: IntegrationLogStatus;
  search?: string;
  createdFrom?: string;
  createdTo?: string;
  limit?: number;
  offset?: number;
}

export interface IntegrationLogsPage {
  logs: IntegrationLog[];
  total: number;
}

export async function listIntegrationLogs(
  supabase: SupabaseClient,
  options: ListIntegrationLogsOptions = {},
): Promise<IntegrationLogsPage> {
  let query = supabase.from("integration_logs").select(LOG_SELECT, { count: "exact" });

  if (options.status) query = query.eq("status", options.status);
  if (options.createdFrom) query = query.gte("created_at", options.createdFrom);
  if (options.createdTo) query = query.lte("created_at", options.createdTo);
  if (options.search) {
    const term = options.search.replace(/[,()%]/g, " ").trim();
    if (term) query = query.or(`event.ilike.%${term}%,message.ilike.%${term}%`);
  }
  if (options.provider) {
    const { data: integration } = await supabase
      .from("integrations")
      .select("id")
      .eq("provider", options.provider)
      .maybeSingle();
    query = query.eq("integration_id", integration?.id ?? "00000000-0000-0000-0000-000000000000");
  }

  const limit = options.limit ?? 50;
  const offset = options.offset ?? 0;

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(`Falha ao carregar logs de integração: ${error.message}`);

  return {
    logs: ((data ?? []) as unknown as IntegrationLogRow[]).map(mapLog),
    total: count ?? 0,
  };
}

export interface CreateIntegrationLogPayload {
  integrationId?: string | null;
  event: string;
  status: IntegrationLogStatus;
  message?: string | null;
  payload?: Record<string, unknown> | null;
  origin?: string | null;
  destination?: string | null;
  durationMs?: number | null;
}

export async function createIntegrationLog(
  supabase: SupabaseClient,
  input: CreateIntegrationLogPayload,
): Promise<void> {
  const { error } = await supabase.from("integration_logs").insert({
    integration_id: input.integrationId ?? null,
    event: input.event,
    status: input.status,
    message: input.message ?? null,
    payload: input.payload ?? null,
    origin: input.origin ?? null,
    destination: input.destination ?? null,
    duration_ms: input.durationMs ?? null,
  });
  if (error) throw new Error(`Falha ao registrar log de integração: ${error.message}`);
}
