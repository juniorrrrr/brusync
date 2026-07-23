import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_PROJECT_PHASES } from "@/domain/projects/defaultPhases";
import { listFilesForProject } from "@/repositories/projects/projectFilesRepository";
import {
  createDefaultPhases,
  listPhasesForProject,
} from "@/repositories/projects/projectPhasesRepository";
import {
  type CreateProjectPayload,
  createProject,
  getProjectById,
} from "@/repositories/projects/projectsRepository";
import { listTasksForProject } from "@/repositories/projects/projectTasksRepository";
import type { ProjectDetail, ProjectPhase } from "@/types/projects";

/** Creating a project always seeds the standard delivery phases
 * (Diagnóstico → ... → Concluído) — the two writes belong together as one
 * business operation, same reasoning Fase 8's prepareConversionEvent used
 * to compose "create the event, then fan out its deliveries". */
export async function createProjectWithDefaultPhases(
  supabase: SupabaseClient,
  payload: CreateProjectPayload,
): Promise<{ id: string }> {
  const { id } = await createProject(supabase, payload);
  await createDefaultPhases(supabase, id, DEFAULT_PROJECT_PHASES);
  return { id };
}

/** Assembles the full drawer payload — project + its phases (each with its
 * own tasks nested in) + project files — from three separate repositories,
 * since crm_projects/_phases/_tasks/_files are deliberately four focused
 * tables rather than one wide query. */
export async function getProjectDetail(
  supabase: SupabaseClient,
  id: string,
): Promise<ProjectDetail | null> {
  const project = await getProjectById(supabase, id);
  if (!project) return null;

  const [phasesRaw, tasks, files] = await Promise.all([
    listPhasesForProject(supabase, id),
    listTasksForProject(supabase, id),
    listFilesForProject(supabase, id),
  ]);

  const phases: ProjectPhase[] = phasesRaw.map((phase) => {
    const phaseTasks = tasks.filter((task) => task.phaseId === phase.id);
    const doneCount = phaseTasks.filter((task) => task.status === "concluido").length;
    return {
      ...phase,
      tasks: phaseTasks,
      progressPercent:
        phaseTasks.length > 0 ? Math.round((doneCount / phaseTasks.length) * 100) : 0,
    };
  });

  return { ...project, phases, files };
}

/** Powers the Cliente drawer's "Projetos" section and its aggregate
 * timeline — every project detail for one client, in parallel. */
export async function getProjectDetailsForClient(
  supabase: SupabaseClient,
  projectIds: string[],
): Promise<ProjectDetail[]> {
  const details = await Promise.all(projectIds.map((id) => getProjectDetail(supabase, id)));
  return details.filter((detail): detail is ProjectDetail => detail !== null);
}
