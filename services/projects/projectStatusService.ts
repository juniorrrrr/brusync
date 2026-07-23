import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  type UpdatePhasePayload,
  updatePhase,
} from "@/repositories/projects/projectPhasesRepository";
import {
  type UpdateProjectPayload,
  updateProject,
} from "@/repositories/projects/projectsRepository";
import { type UpdateTaskPayload, updateTask } from "@/repositories/projects/projectTasksRepository";
import type { ProjectPhaseStatus, ProjectStatus, ProjectTaskStatus } from "@/types/projects";

/** Status transitions carry timestamp side effects (starting a phase stamps
 * started_at, finishing stamps completed_at, ...) — centralizing that here
 * means every call site (drawer actions, future integrations) gets the same
 * behavior instead of each one remembering to set the right date. */
export async function transitionProjectStatus(
  supabase: SupabaseClient,
  id: string,
  status: ProjectStatus,
): Promise<void> {
  const patch: UpdateProjectPayload = { status };
  if (status === "concluido") patch.completedAt = new Date().toISOString();
  await updateProject(supabase, id, patch);
}

export async function transitionPhaseStatus(
  supabase: SupabaseClient,
  id: string,
  status: ProjectPhaseStatus,
  currentStartedAt: string | null,
): Promise<void> {
  const patch: UpdatePhasePayload = { status };
  if (status === "em_andamento" && !currentStartedAt) patch.startedAt = new Date().toISOString();
  if (status === "concluido") patch.completedAt = new Date().toISOString();
  await updatePhase(supabase, id, patch);
}

export async function transitionTaskStatus(
  supabase: SupabaseClient,
  id: string,
  status: ProjectTaskStatus,
): Promise<void> {
  const patch: UpdateTaskPayload = { status };
  patch.completedAt = status === "concluido" ? new Date().toISOString() : null;
  await updateTask(supabase, id, patch);
}
