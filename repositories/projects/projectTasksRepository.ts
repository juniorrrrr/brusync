import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ProjectTask,
  ProjectTaskComment,
  ProjectTaskPriority,
  ProjectTaskStatus,
} from "@/types/projects";

interface ProjectTaskRow {
  id: string;
  project_id: string;
  phase_id: string | null;
  title: string;
  description: string | null;
  assignee_id: string | null;
  priority: ProjectTaskPriority;
  due_at: string | null;
  status: ProjectTaskStatus;
  completed_at: string | null;
  comments: ProjectTaskComment[] | null;
  created_at: string;
  updated_at: string;
  assignee?: { name: string | null; email: string | null } | null;
  files?: { id: string }[] | null;
}

const TASK_SELECT = `
  id, project_id, phase_id, title, description, assignee_id, priority, due_at, status, completed_at, comments, created_at, updated_at,
  assignee:profiles!crm_project_tasks_assignee_id_fkey (name, email),
  files:crm_project_files!crm_project_files_task_id_fkey (id)
`;

function mapTask(row: ProjectTaskRow): ProjectTask {
  return {
    id: row.id,
    projectId: row.project_id,
    phaseId: row.phase_id,
    title: row.title,
    description: row.description,
    assigneeId: row.assignee_id,
    assigneeName: row.assignee?.name ?? row.assignee?.email ?? null,
    priority: row.priority,
    dueAt: row.due_at,
    status: row.status,
    completedAt: row.completed_at,
    comments: row.comments ?? [],
    fileCount: row.files?.length ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listTasksForProject(
  supabase: SupabaseClient,
  projectId: string,
): Promise<ProjectTask[]> {
  const { data, error } = await supabase
    .from("crm_project_tasks")
    .select(TASK_SELECT)
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Falha ao carregar tarefas do projeto: ${error.message}`);
  return ((data ?? []) as unknown as ProjectTaskRow[]).map(mapTask);
}

export async function getTaskById(
  supabase: SupabaseClient,
  id: string,
): Promise<ProjectTask | null> {
  const { data, error } = await supabase
    .from("crm_project_tasks")
    .select(TASK_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Falha ao carregar tarefa: ${error.message}`);
  return data ? mapTask(data as unknown as ProjectTaskRow) : null;
}

export interface CreateTaskPayload {
  projectId: string;
  phaseId: string | null;
  title: string;
  description: string | null;
  assigneeId: string | null;
  priority: ProjectTaskPriority;
  dueAt: string | null;
  createdBy: string | null;
}

export async function createTask(
  supabase: SupabaseClient,
  payload: CreateTaskPayload,
): Promise<{ id: string }> {
  const { data, error } = await supabase
    .from("crm_project_tasks")
    .insert({
      project_id: payload.projectId,
      phase_id: payload.phaseId,
      title: payload.title,
      description: payload.description,
      assignee_id: payload.assigneeId,
      priority: payload.priority,
      due_at: payload.dueAt,
      created_by: payload.createdBy,
    })
    .select("id")
    .single();

  if (error) throw new Error(`Falha ao criar tarefa: ${error.message}`);
  return data as { id: string };
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string | null;
  assigneeId?: string | null;
  priority?: ProjectTaskPriority;
  dueAt?: string | null;
  status?: ProjectTaskStatus;
  completedAt?: string | null;
  phaseId?: string | null;
}

export async function updateTask(
  supabase: SupabaseClient,
  id: string,
  patch: UpdateTaskPayload,
): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (patch.title !== undefined) payload.title = patch.title;
  if (patch.description !== undefined) payload.description = patch.description;
  if (patch.assigneeId !== undefined) payload.assignee_id = patch.assigneeId;
  if (patch.priority !== undefined) payload.priority = patch.priority;
  if (patch.dueAt !== undefined) payload.due_at = patch.dueAt;
  if (patch.status !== undefined) payload.status = patch.status;
  if (patch.completedAt !== undefined) payload.completed_at = patch.completedAt;
  if (patch.phaseId !== undefined) payload.phase_id = patch.phaseId;

  const { error } = await supabase.from("crm_project_tasks").update(payload).eq("id", id);
  if (error) throw new Error(`Falha ao atualizar tarefa: ${error.message}`);
}

export async function deleteTask(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("crm_project_tasks").delete().eq("id", id);
  if (error) throw new Error(`Falha ao excluir tarefa: ${error.message}`);
}

/** Comments are an append-only jsonb array on the task row itself (no
 * dedicated 5th table) — read-modify-write, fine for a low-concurrency
 * internal tool where two people are very unlikely to comment on the same
 * task in the same instant. */
export async function addTaskComment(
  supabase: SupabaseClient,
  taskId: string,
  comment: ProjectTaskComment,
): Promise<void> {
  const { data: current, error: readError } = await supabase
    .from("crm_project_tasks")
    .select("comments")
    .eq("id", taskId)
    .single();

  if (readError) throw new Error(`Falha ao carregar comentários: ${readError.message}`);

  const comments = ((current?.comments ?? []) as ProjectTaskComment[]).concat(comment);

  const { error } = await supabase.from("crm_project_tasks").update({ comments }).eq("id", taskId);

  if (error) throw new Error(`Falha ao adicionar comentário: ${error.message}`);
}
