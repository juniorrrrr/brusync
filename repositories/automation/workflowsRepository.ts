import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AutomationActionType,
  AutomationConditionType,
  AutomationPriority,
  AutomationStatus,
  AutomationTriggerType,
  AutomationWorkflow,
} from "@/types/automation";

interface AutomationTriggerRow {
  trigger_type: AutomationTriggerType;
  trigger_config: Record<string, unknown>;
}

interface AutomationWorkflowRow {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  description: string | null;
  status: AutomationStatus;
  priority: AutomationPriority;
  condition_type: AutomationConditionType;
  condition_config: Record<string, unknown>;
  action_type: AutomationActionType;
  action_config: Record<string, unknown>;
  created_by: string | null;
  trigger?: AutomationTriggerRow[] | AutomationTriggerRow | null;
}

const WORKFLOW_SELECT = `
  id, created_at, updated_at, name, description, status, priority,
  condition_type, condition_config, action_type, action_config, created_by,
  trigger:automation_triggers (trigger_type, trigger_config)
`;

function mapWorkflow(row: AutomationWorkflowRow): AutomationWorkflow {
  const triggerRow = Array.isArray(row.trigger) ? row.trigger[0] : row.trigger;

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    status: row.status,
    priority: row.priority,
    conditionType: row.condition_type,
    conditionConfig: row.condition_config ?? {},
    actionType: row.action_type,
    actionConfig: row.action_config ?? {},
    trigger: triggerRow
      ? { triggerType: triggerRow.trigger_type, triggerConfig: triggerRow.trigger_config ?? {} }
      : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
  };
}

export interface ListWorkflowsOptions {
  status?: AutomationStatus;
  triggerType?: AutomationTriggerType;
  search?: string;
}

export async function listWorkflows(
  supabase: SupabaseClient,
  options: ListWorkflowsOptions = {},
): Promise<AutomationWorkflow[]> {
  let query = supabase.from("automation_workflows").select(WORKFLOW_SELECT);

  if (options.status) query = query.eq("status", options.status);
  if (options.search) {
    const term = options.search.replace(/[,()%]/g, " ").trim();
    if (term) query = query.ilike("name", `%${term}%`);
  }

  const { data, error } = await query
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Falha ao carregar automações: ${error.message}`);

  let workflows = ((data ?? []) as unknown as AutomationWorkflowRow[]).map(mapWorkflow);
  if (options.triggerType) {
    workflows = workflows.filter((w) => w.trigger?.triggerType === options.triggerType);
  }
  return workflows;
}

/** Only the workflows an actual trigger firing needs to consider — active,
 * matching this exact trigger type, ordered so higher priority runs first. */
export async function listActiveWorkflowsForTrigger(
  supabase: SupabaseClient,
  triggerType: AutomationTriggerType,
): Promise<AutomationWorkflow[]> {
  // The trigger-type filter can't be pushed into this query as a plain
  // `.eq()` on the embedded resource (PostgREST only turns that into a real
  // join condition with an `!inner` hint, which would need a second shape
  // of this same select) — filtered in JS below instead, same approach
  // conversion_events uses for its destination/status filters.
  const { data, error } = await supabase
    .from("automation_workflows")
    .select(WORKFLOW_SELECT)
    .eq("status", "ativo")
    .order("priority", { ascending: false });

  if (error) throw new Error(`Falha ao carregar automações ativas: ${error.message}`);

  return ((data ?? []) as unknown as AutomationWorkflowRow[])
    .map(mapWorkflow)
    .filter((w) => w.trigger?.triggerType === triggerType);
}

export async function getWorkflowById(
  supabase: SupabaseClient,
  id: string,
): Promise<AutomationWorkflow | null> {
  const { data, error } = await supabase
    .from("automation_workflows")
    .select(WORKFLOW_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Falha ao carregar automação: ${error.message}`);
  return data ? mapWorkflow(data as unknown as AutomationWorkflowRow) : null;
}

export interface CreateWorkflowPayload {
  name: string;
  description: string | null;
  status: AutomationStatus;
  priority: AutomationPriority;
  conditionType: AutomationConditionType;
  conditionConfig: Record<string, unknown>;
  actionType: AutomationActionType;
  actionConfig: Record<string, unknown>;
  triggerType: AutomationTriggerType;
  triggerConfig: Record<string, unknown>;
  createdBy: string | null;
}

export async function createWorkflow(
  supabase: SupabaseClient,
  payload: CreateWorkflowPayload,
): Promise<{ id: string }> {
  const { data, error } = await supabase
    .from("automation_workflows")
    .insert({
      name: payload.name,
      description: payload.description,
      status: payload.status,
      priority: payload.priority,
      condition_type: payload.conditionType,
      condition_config: payload.conditionConfig,
      action_type: payload.actionType,
      action_config: payload.actionConfig,
      created_by: payload.createdBy,
    })
    .select("id")
    .single();

  if (error) throw new Error(`Falha ao criar automação: ${error.message}`);

  const workflowId = (data as { id: string }).id;

  const { error: triggerError } = await supabase.from("automation_triggers").insert({
    workflow_id: workflowId,
    trigger_type: payload.triggerType,
    trigger_config: payload.triggerConfig,
  });

  if (triggerError) throw new Error(`Falha ao criar gatilho da automação: ${triggerError.message}`);

  return { id: workflowId };
}

export interface UpdateWorkflowPayload {
  name?: string;
  description?: string | null;
  status?: AutomationStatus;
  priority?: AutomationPriority;
  conditionType?: AutomationConditionType;
  conditionConfig?: Record<string, unknown>;
  actionType?: AutomationActionType;
  actionConfig?: Record<string, unknown>;
  triggerType?: AutomationTriggerType;
  triggerConfig?: Record<string, unknown>;
}

export async function updateWorkflow(
  supabase: SupabaseClient,
  id: string,
  patch: UpdateWorkflowPayload,
): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (patch.name !== undefined) payload.name = patch.name;
  if (patch.description !== undefined) payload.description = patch.description;
  if (patch.status !== undefined) payload.status = patch.status;
  if (patch.priority !== undefined) payload.priority = patch.priority;
  if (patch.conditionType !== undefined) payload.condition_type = patch.conditionType;
  if (patch.conditionConfig !== undefined) payload.condition_config = patch.conditionConfig;
  if (patch.actionType !== undefined) payload.action_type = patch.actionType;
  if (patch.actionConfig !== undefined) payload.action_config = patch.actionConfig;

  if (Object.keys(payload).length > 0) {
    const { error } = await supabase.from("automation_workflows").update(payload).eq("id", id);
    if (error) throw new Error(`Falha ao atualizar automação: ${error.message}`);
  }

  if (patch.triggerType !== undefined || patch.triggerConfig !== undefined) {
    const { error } = await supabase.from("automation_triggers").upsert(
      {
        workflow_id: id,
        trigger_type: patch.triggerType,
        trigger_config: patch.triggerConfig ?? {},
      },
      { onConflict: "workflow_id" },
    );
    if (error) throw new Error(`Falha ao atualizar gatilho da automação: ${error.message}`);
  }
}

export async function deleteWorkflow(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("automation_workflows").delete().eq("id", id);
  if (error) throw new Error(`Falha ao excluir automação: ${error.message}`);
}

export async function countActiveWorkflows(supabase: SupabaseClient): Promise<number> {
  const { count, error } = await supabase
    .from("automation_workflows")
    .select("*", { count: "exact", head: true })
    .eq("status", "ativo");

  if (error) throw new Error(`Falha ao contar automações ativas: ${error.message}`);
  return count ?? 0;
}
