import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AutomationExecution,
  AutomationExecutionStatus,
  AutomationTriggerType,
} from "@/types/automation";

interface AutomationExecutionRow {
  id: string;
  workflow_id: string | null;
  crm_lead_id: string | null;
  trigger_type: AutomationTriggerType;
  status: AutomationExecutionStatus;
  result_message: string | null;
  duration_ms: number;
  executed_at: string;
  workflow?: { name: string } | null;
  lead?: { name: string } | null;
}

const EXECUTION_SELECT = `
  id, workflow_id, crm_lead_id, trigger_type, status, result_message, duration_ms, executed_at,
  workflow:automation_workflows!automation_executions_workflow_id_fkey (name),
  lead:crm_leads!automation_executions_crm_lead_id_fkey (name)
`;

function mapExecution(row: AutomationExecutionRow): AutomationExecution {
  return {
    id: row.id,
    workflowId: row.workflow_id,
    workflowName: row.workflow?.name ?? null,
    crmLeadId: row.crm_lead_id,
    leadName: row.lead?.name ?? null,
    triggerType: row.trigger_type,
    status: row.status,
    resultMessage: row.result_message,
    durationMs: row.duration_ms,
    executedAt: row.executed_at,
  };
}

export interface ListExecutionsOptions {
  workflowId?: string;
  status?: AutomationExecutionStatus;
  triggerType?: AutomationTriggerType;
  createdFrom?: string;
  createdTo?: string;
  limit?: number;
  offset?: number;
}

export interface ExecutionsPage {
  executions: AutomationExecution[];
  total: number;
}

export async function listExecutions(
  supabase: SupabaseClient,
  options: ListExecutionsOptions = {},
): Promise<ExecutionsPage> {
  let query = supabase.from("automation_executions").select(EXECUTION_SELECT, { count: "exact" });

  if (options.workflowId) query = query.eq("workflow_id", options.workflowId);
  if (options.status) query = query.eq("status", options.status);
  if (options.triggerType) query = query.eq("trigger_type", options.triggerType);
  if (options.createdFrom) query = query.gte("executed_at", options.createdFrom);
  if (options.createdTo) query = query.lte("executed_at", options.createdTo);

  const { data, error, count } = await query
    .order("executed_at", { ascending: false })
    .range(options.offset ?? 0, (options.offset ?? 0) + (options.limit ?? 50) - 1);

  if (error) throw new Error(`Falha ao carregar execuções de automações: ${error.message}`);

  const executions = ((data ?? []) as unknown as AutomationExecutionRow[]).map(mapExecution);
  return { executions, total: count ?? executions.length };
}

export async function countExecutionsToday(supabase: SupabaseClient): Promise<number> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from("automation_executions")
    .select("*", { count: "exact", head: true })
    .gte("executed_at", startOfDay.toISOString());

  if (error) throw new Error(`Falha ao contar execuções de hoje: ${error.message}`);
  return count ?? 0;
}

export interface ExecutionStats {
  total: number;
  success: number;
  failed: number;
  averageDurationMs: number | null;
}

export async function getExecutionStatsSince(
  supabase: SupabaseClient,
  since: string,
): Promise<ExecutionStats> {
  const { data, error } = await supabase
    .from("automation_executions")
    .select("status, duration_ms")
    .gte("executed_at", since);

  if (error) throw new Error(`Falha ao calcular estatísticas de execuções: ${error.message}`);

  const rows = (data ?? []) as { status: AutomationExecutionStatus; duration_ms: number }[];
  const total = rows.length;
  const success = rows.filter((r) => r.status === "sucesso").length;
  const failed = rows.filter((r) => r.status === "erro").length;
  const averageDurationMs =
    total > 0 ? Math.round(rows.reduce((sum, r) => sum + r.duration_ms, 0) / total) : null;

  return { total, success, failed, averageDurationMs };
}

export interface CreateExecutionPayload {
  workflowId: string | null;
  crmLeadId: string | null;
  triggerType: AutomationTriggerType;
  status: AutomationExecutionStatus;
  resultMessage: string | null;
  durationMs: number;
  eventSnapshot?: Record<string, unknown> | null;
}

export async function createExecution(
  supabase: SupabaseClient,
  payload: CreateExecutionPayload,
): Promise<{ id: string }> {
  const { data, error } = await supabase
    .from("automation_executions")
    .insert({
      workflow_id: payload.workflowId,
      crm_lead_id: payload.crmLeadId,
      trigger_type: payload.triggerType,
      status: payload.status,
      result_message: payload.resultMessage,
      duration_ms: payload.durationMs,
      event_snapshot: payload.eventSnapshot ?? null,
    })
    .select("id")
    .single();

  if (error) throw new Error(`Falha ao registrar execução de automação: ${error.message}`);
  return data as { id: string };
}

/** Dedup guard for the time-based "lead parado" check — a workflow should
 * not re-fire for the same lead every time the scheduled check runs while
 * the lead stays stalled; only after a fresh interaction resets the clock. */
export async function hasExecutionSince(
  supabase: SupabaseClient,
  workflowId: string,
  crmLeadId: string,
  since: string,
): Promise<boolean> {
  const { count, error } = await supabase
    .from("automation_executions")
    .select("*", { count: "exact", head: true })
    .eq("workflow_id", workflowId)
    .eq("crm_lead_id", crmLeadId)
    .gte("executed_at", since);

  if (error) throw new Error(`Falha ao verificar execuções anteriores: ${error.message}`);
  return (count ?? 0) > 0;
}
