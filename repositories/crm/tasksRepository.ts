import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { type LeadTaskRow, mapLeadTask } from "@/repositories/crm/mappers";
import type { LeadTask, TaskPriority, TaskStatus } from "@/types/crm";

const TASK_SELECT = `
  id, crm_lead_id, title, description, status, priority, due_at, completed_at, assignee_id, created_by, created_at, updated_at,
  assignee:profiles!crm_lead_tasks_assignee_id_fkey (id, name, email)
`;

export async function listTasksForLead(
  supabase: SupabaseClient,
  crmLeadId: string,
): Promise<LeadTask[]> {
  const { data, error } = await supabase
    .from("crm_lead_tasks")
    .select(TASK_SELECT)
    .eq("crm_lead_id", crmLeadId)
    .order("status", { ascending: true })
    .order("due_at", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Falha ao carregar tarefas: ${error.message}`);
  return ((data ?? []) as unknown as LeadTaskRow[]).map(mapLeadTask);
}

export interface CreateTaskPayload {
  crmLeadId: string;
  title: string;
  description?: string | null;
  priority?: TaskPriority;
  dueAt?: string | null;
  assigneeId?: string | null;
  createdBy: string;
}

export async function createTask(
  supabase: SupabaseClient,
  payload: CreateTaskPayload,
): Promise<LeadTask> {
  const { data, error } = await supabase
    .from("crm_lead_tasks")
    .insert({
      crm_lead_id: payload.crmLeadId,
      title: payload.title,
      description: payload.description ?? null,
      priority: payload.priority ?? "medium",
      due_at: payload.dueAt ?? null,
      assignee_id: payload.assigneeId ?? null,
      created_by: payload.createdBy,
    })
    .select(TASK_SELECT)
    .single();

  if (error) throw new Error(`Falha ao criar tarefa: ${error.message}`);
  return mapLeadTask(data as unknown as LeadTaskRow);
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string | null;
  priority?: TaskPriority;
  dueAt?: string | null;
  assigneeId?: string | null;
  status?: TaskStatus;
}

export async function updateTask(
  supabase: SupabaseClient,
  taskId: string,
  patch: UpdateTaskPayload,
): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (patch.title !== undefined) payload.title = patch.title;
  if (patch.description !== undefined) payload.description = patch.description;
  if (patch.priority !== undefined) payload.priority = patch.priority;
  if (patch.dueAt !== undefined) payload.due_at = patch.dueAt;
  if (patch.assigneeId !== undefined) payload.assignee_id = patch.assigneeId;
  if (patch.status !== undefined) {
    payload.status = patch.status;
    payload.completed_at = patch.status === "done" ? new Date().toISOString() : null;
  }

  const { error } = await supabase.from("crm_lead_tasks").update(payload).eq("id", taskId);
  if (error) throw new Error(`Falha ao atualizar tarefa: ${error.message}`);
}

export async function deleteTask(supabase: SupabaseClient, taskId: string): Promise<void> {
  const { error } = await supabase.from("crm_lead_tasks").delete().eq("id", taskId);
  if (error) throw new Error(`Falha ao excluir tarefa: ${error.message}`);
}

export interface UpcomingTask extends LeadTask {
  leadName: string;
}

export async function listUpcomingTasksAcrossLeads(
  supabase: SupabaseClient,
  limit = 6,
): Promise<UpcomingTask[]> {
  const { data, error } = await supabase
    .from("crm_lead_tasks")
    .select(`${TASK_SELECT}, lead:crm_leads!crm_lead_tasks_crm_lead_id_fkey (name)`)
    .neq("status", "done")
    .order("due_at", { ascending: true, nullsFirst: false })
    .limit(limit);

  if (error) throw new Error(`Falha ao carregar tarefas pendentes: ${error.message}`);

  return ((data ?? []) as unknown as (LeadTaskRow & { lead: { name: string } | null })[]).map(
    (row) => ({ ...mapLeadTask(row), leadName: row.lead?.name ?? "Lead removido" }),
  );
}

export async function getTaskById(
  supabase: SupabaseClient,
  taskId: string,
): Promise<LeadTask | null> {
  const { data, error } = await supabase
    .from("crm_lead_tasks")
    .select(TASK_SELECT)
    .eq("id", taskId)
    .maybeSingle();

  if (error) throw new Error(`Falha ao carregar tarefa: ${error.message}`);
  if (!data) return null;
  return mapLeadTask(data as unknown as LeadTaskRow);
}
