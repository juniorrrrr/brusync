"use server";

import { revalidatePath } from "next/cache";
import { requireCrmProfile } from "@/application/crm/authGuard";
import { PROJECT_TASK_STATUSES } from "@/domain/projects/types";
import {
  addTaskComment,
  createTask,
  deleteTask,
  updateTask,
} from "@/repositories/projects/projectTasksRepository";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { transitionTaskStatus } from "@/services/projects/projectStatusService";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type { ProjectTaskPriority, ProjectTaskStatus } from "@/types/projects";

const DEMO_WRITE_BLOCKED_MESSAGE =
  "Ação indisponível em Modo Demonstração — nenhuma escrita é enviada ao banco.";

export interface TaskActionState {
  status: "idle" | "success" | "error";
  message?: string;
}

export async function saveTaskAction(
  _prevState: TaskActionState,
  formData: FormData,
): Promise<TaskActionState> {
  const profile = await requireCrmProfile();
  if (await isDemoModeActive()) return { status: "error", message: DEMO_WRITE_BLOCKED_MESSAGE };

  const id = String(formData.get("id") ?? "").trim();
  const projectId = String(formData.get("projectId") ?? "").trim();
  const phaseId = String(formData.get("phaseId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { status: "error", message: "Informe um título para a tarefa." };

  const description = String(formData.get("description") ?? "").trim();
  const assigneeIdRaw = String(formData.get("assigneeId") ?? "").trim();
  const priority = String(formData.get("priority") ?? "media") as ProjectTaskPriority;
  const dueAtRaw = String(formData.get("dueAt") ?? "").trim();
  const dueAt = dueAtRaw ? new Date(dueAtRaw).toISOString() : null;

  const supabase = await getSupabaseAuthClient();

  if (id) {
    await updateTask(supabase, id, {
      title,
      description: description || null,
      assigneeId: assigneeIdRaw || null,
      priority,
      dueAt,
    });
  } else {
    if (!projectId) return { status: "error", message: "Projeto não informado." };
    await createTask(supabase, {
      projectId,
      phaseId: phaseId || null,
      title,
      description: description || null,
      assigneeId: assigneeIdRaw || null,
      priority,
      dueAt,
      createdBy: profile.id,
    });
  }

  revalidatePath("/projetos");
  return { status: "success", message: id ? "Tarefa atualizada." : "Tarefa criada." };
}

export async function transitionTaskStatusAction(
  id: string,
  status: ProjectTaskStatus,
): Promise<{ ok: boolean; error?: string }> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return { ok: false, error: DEMO_WRITE_BLOCKED_MESSAGE };
  if (!PROJECT_TASK_STATUSES.includes(status)) return { ok: false, error: "Status inválido." };

  const supabase = await getSupabaseAuthClient();
  await transitionTaskStatus(supabase, id, status);

  revalidatePath("/projetos");
  return { ok: true };
}

export async function deleteTaskAction(id: string): Promise<{ ok: boolean; error?: string }> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return { ok: false, error: DEMO_WRITE_BLOCKED_MESSAGE };

  const supabase = await getSupabaseAuthClient();
  await deleteTask(supabase, id);

  revalidatePath("/projetos");
  return { ok: true };
}

export async function addTaskCommentAction(
  taskId: string,
  body: string,
): Promise<{ ok: boolean; error?: string }> {
  const profile = await requireCrmProfile();
  if (await isDemoModeActive()) return { ok: false, error: DEMO_WRITE_BLOCKED_MESSAGE };
  if (!body.trim()) return { ok: false, error: "Escreva um comentário." };

  const supabase = await getSupabaseAuthClient();
  await addTaskComment(supabase, taskId, {
    id: crypto.randomUUID(),
    authorId: profile.id,
    authorName: profile.name ?? profile.email,
    body: body.trim(),
    createdAt: new Date().toISOString(),
  });

  revalidatePath("/projetos");
  return { ok: true };
}
