import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AutomationLogEntry, AutomationLogLevel } from "@/types/automation";

interface AutomationLogRow {
  id: string;
  workflow_id: string | null;
  execution_id: string | null;
  level: AutomationLogLevel;
  message: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  workflow?: { name: string } | null;
}

const LOG_SELECT = `
  id, workflow_id, execution_id, level, message, metadata, created_at,
  workflow:automation_workflows!automation_logs_workflow_id_fkey (name)
`;

function mapLog(row: AutomationLogRow): AutomationLogEntry {
  return {
    id: row.id,
    workflowId: row.workflow_id,
    workflowName: row.workflow?.name ?? null,
    executionId: row.execution_id,
    level: row.level,
    message: row.message,
    metadata: row.metadata,
    createdAt: row.created_at,
  };
}

export interface ListLogsOptions {
  workflowId?: string;
  level?: AutomationLogLevel;
  search?: string;
  createdFrom?: string;
  createdTo?: string;
  limit?: number;
  offset?: number;
}

export interface LogsPage {
  logs: AutomationLogEntry[];
  total: number;
}

export async function listLogs(
  supabase: SupabaseClient,
  options: ListLogsOptions = {},
): Promise<LogsPage> {
  let query = supabase.from("automation_logs").select(LOG_SELECT, { count: "exact" });

  if (options.workflowId) query = query.eq("workflow_id", options.workflowId);
  if (options.level) query = query.eq("level", options.level);
  if (options.createdFrom) query = query.gte("created_at", options.createdFrom);
  if (options.createdTo) query = query.lte("created_at", options.createdTo);

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(options.offset ?? 0, (options.offset ?? 0) + (options.limit ?? 50) - 1);

  if (error) throw new Error(`Falha ao carregar logs de automações: ${error.message}`);

  let logs = ((data ?? []) as unknown as AutomationLogRow[]).map(mapLog);
  if (options.search) {
    const term = options.search.toLowerCase();
    logs = logs.filter((log) => log.message.toLowerCase().includes(term));
  }

  return { logs, total: count ?? logs.length };
}

export interface CreateLogPayload {
  workflowId: string | null;
  executionId: string | null;
  level: AutomationLogLevel;
  message: string;
  metadata?: Record<string, unknown> | null;
}

export async function createLog(
  supabase: SupabaseClient,
  payload: CreateLogPayload,
): Promise<void> {
  const { error } = await supabase.from("automation_logs").insert({
    workflow_id: payload.workflowId,
    execution_id: payload.executionId,
    level: payload.level,
    message: payload.message,
    metadata: payload.metadata ?? null,
  });

  if (error) throw new Error(`Falha ao registrar log de automação: ${error.message}`);
}
