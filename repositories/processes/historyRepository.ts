import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProcessHistoryEntry, ProcessHistoryEventType } from "@/types/processes";

interface HistoryRow {
  id: string;
  process_id: string;
  event_type: ProcessHistoryEventType;
  description: string;
  metadata: Record<string, unknown>;
  created_at: string;
  actor?: { name: string | null; email: string | null } | null;
  process?: { name: string } | null;
}

const HISTORY_SELECT = `
  id, process_id, event_type, description, metadata, created_at,
  actor:profiles!crm_process_history_actor_id_fkey(name, email)
`;

const HISTORY_SELECT_WITH_PROCESS = `
  id, process_id, event_type, description, metadata, created_at,
  actor:profiles!crm_process_history_actor_id_fkey(name, email),
  process:crm_processes!crm_process_history_process_id_fkey(name)
`;

function mapEntry(row: HistoryRow): ProcessHistoryEntry {
  return {
    id: row.id,
    processId: row.process_id,
    processName: row.process?.name ?? null,
    eventType: row.event_type,
    description: row.description,
    metadata: row.metadata ?? {},
    actorName: row.actor?.name ?? row.actor?.email ?? null,
    createdAt: row.created_at,
  };
}

export async function listHistoryForProcess(
  supabase: SupabaseClient,
  processId: string,
): Promise<ProcessHistoryEntry[]> {
  const { data, error } = await supabase
    .from("crm_process_history")
    .select(HISTORY_SELECT)
    .eq("process_id", processId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Falha ao carregar histórico: ${error.message}`);
  return ((data ?? []) as unknown as HistoryRow[]).map(mapEntry);
}

export async function listRecentHistory(
  supabase: SupabaseClient,
  limit = 12,
): Promise<ProcessHistoryEntry[]> {
  const { data, error } = await supabase
    .from("crm_process_history")
    .select(HISTORY_SELECT_WITH_PROCESS)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Falha ao carregar histórico recente: ${error.message}`);
  return ((data ?? []) as unknown as HistoryRow[]).map(mapEntry);
}

export interface InsertHistoryPayload {
  processId: string;
  eventType: ProcessHistoryEventType;
  description: string;
  metadata?: Record<string, unknown>;
  actorId: string | null;
}

export async function insertHistoryEntry(
  supabase: SupabaseClient,
  payload: InsertHistoryPayload,
): Promise<void> {
  const { error } = await supabase.from("crm_process_history").insert({
    process_id: payload.processId,
    event_type: payload.eventType,
    description: payload.description,
    metadata: payload.metadata ?? {},
    actor_id: payload.actorId,
  });

  if (error) throw new Error(`Falha ao registrar histórico: ${error.message}`);
}
