"use server";

import { revalidatePath } from "next/cache";
import { requireCrmProfile } from "@/application/crm/authGuard";
import { createActivity } from "@/repositories/crm/activitiesRepository";
import { touchLeadInteraction } from "@/repositories/crm/leadsRepository";
import {
  createTask,
  deleteTask,
  getTaskById,
  listTasksForLead,
  updateTask,
} from "@/repositories/crm/tasksRepository";
import {
  createTaskSchema,
  deleteTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
} from "@/schemas/crm/task.schema";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type { LeadTask } from "@/types/crm";

function firstIssueMessage(error: { issues: { message: string }[] }) {
  return error.issues[0]?.message ?? "Dados inválidos.";
}

/** Fetched lazily, the first time the Tarefas tab is opened. */
export async function fetchTasks(crmLeadId: string): Promise<LeadTask[]> {
  await requireCrmProfile();
  const supabase = await getSupabaseAuthClient();
  return listTasksForLead(supabase, crmLeadId);
}

export async function createTaskAction(input: {
  crmLeadId: string;
  title: string;
  description?: string;
  priority?: "low" | "medium" | "high";
  dueAt?: string;
  assigneeId?: string;
}): Promise<{ ok: boolean; task?: LeadTask; error?: string }> {
  const profile = await requireCrmProfile();
  const parsed = createTaskSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssueMessage(parsed.error) };

  const supabase = await getSupabaseAuthClient();
  const task = await createTask(supabase, { ...parsed.data, createdBy: profile.id });
  await createActivity(supabase, {
    crmLeadId: parsed.data.crmLeadId,
    type: "task_created",
    title: `Tarefa criada: ${parsed.data.title}`,
    createdBy: profile.id,
  });

  revalidatePath("/dashboard");
  return { ok: true, task };
}

export async function updateTaskAction(input: {
  taskId: string;
  title?: string;
  description?: string;
  priority?: "low" | "medium" | "high";
  dueAt?: string;
  assigneeId?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const profile = await requireCrmProfile();
  const parsed = updateTaskSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssueMessage(parsed.error) };

  const supabase = await getSupabaseAuthClient();
  const existing = await getTaskById(supabase, parsed.data.taskId);
  if (!existing) return { ok: false, error: "Tarefa não encontrada." };

  const { taskId, ...patch } = parsed.data;
  await updateTask(supabase, taskId, patch);
  await createActivity(supabase, {
    crmLeadId: existing.crmLeadId,
    type: "task_updated",
    title: `Tarefa editada: ${existing.title}`,
    createdBy: profile.id,
  });

  revalidatePath("/dashboard");
  return { ok: true };
}

export async function updateTaskStatusAction(
  taskId: string,
  status: "pending" | "in_progress" | "done",
): Promise<{ ok: boolean; error?: string }> {
  const profile = await requireCrmProfile();
  const parsed = updateTaskStatusSchema.safeParse({ taskId, status });
  if (!parsed.success) return { ok: false, error: firstIssueMessage(parsed.error) };

  const supabase = await getSupabaseAuthClient();
  const existing = await getTaskById(supabase, parsed.data.taskId);
  if (!existing) return { ok: false, error: "Tarefa não encontrada." };

  await updateTask(supabase, parsed.data.taskId, { status: parsed.data.status });

  if (parsed.data.status === "done") {
    await createActivity(supabase, {
      crmLeadId: existing.crmLeadId,
      type: "task_completed",
      title: `Tarefa concluída: ${existing.title}`,
      createdBy: profile.id,
    });
    await touchLeadInteraction(supabase, existing.crmLeadId);
  }

  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteTaskAction(taskId: string): Promise<{ ok: boolean; error?: string }> {
  const profile = await requireCrmProfile();
  const parsed = deleteTaskSchema.safeParse({ taskId });
  if (!parsed.success) return { ok: false, error: firstIssueMessage(parsed.error) };

  const supabase = await getSupabaseAuthClient();
  const existing = await getTaskById(supabase, parsed.data.taskId);
  if (!existing) return { ok: false, error: "Tarefa não encontrada." };

  await deleteTask(supabase, parsed.data.taskId);
  await createActivity(supabase, {
    crmLeadId: existing.crmLeadId,
    type: "task_deleted",
    title: `Tarefa excluída: ${existing.title}`,
    createdBy: profile.id,
  });

  revalidatePath("/dashboard");
  return { ok: true };
}
