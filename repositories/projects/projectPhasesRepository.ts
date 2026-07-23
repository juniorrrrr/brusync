import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProjectPhase, ProjectPhaseStatus } from "@/types/projects";

interface ProjectPhaseRow {
  id: string;
  project_id: string;
  name: string;
  position: number;
  status: ProjectPhaseStatus;
  started_at: string | null;
  due_at: string | null;
  completed_at: string | null;
}

const PHASE_SELECT = "id, project_id, name, position, status, started_at, due_at, completed_at";

function mapPhase(row: ProjectPhaseRow): Omit<ProjectPhase, "tasks" | "progressPercent"> {
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    position: row.position,
    status: row.status,
    startedAt: row.started_at,
    dueAt: row.due_at,
    completedAt: row.completed_at,
  };
}

export async function listPhasesForProject(
  supabase: SupabaseClient,
  projectId: string,
): Promise<Omit<ProjectPhase, "tasks" | "progressPercent">[]> {
  const { data, error } = await supabase
    .from("crm_project_phases")
    .select(PHASE_SELECT)
    .eq("project_id", projectId)
    .order("position", { ascending: true });

  if (error) throw new Error(`Falha ao carregar etapas do projeto: ${error.message}`);
  return ((data ?? []) as ProjectPhaseRow[]).map(mapPhase);
}

export interface CreatePhasePayload {
  projectId: string;
  name: string;
  position: number;
  status?: ProjectPhaseStatus;
  dueAt?: string | null;
}

export async function createPhase(
  supabase: SupabaseClient,
  payload: CreatePhasePayload,
): Promise<{ id: string }> {
  const { data, error } = await supabase
    .from("crm_project_phases")
    .insert({
      project_id: payload.projectId,
      name: payload.name,
      position: payload.position,
      status: payload.status ?? "pendente",
      due_at: payload.dueAt ?? null,
    })
    .select("id")
    .single();

  if (error) throw new Error(`Falha ao criar etapa: ${error.message}`);
  return data as { id: string };
}

export async function createDefaultPhases(
  supabase: SupabaseClient,
  projectId: string,
  names: string[],
): Promise<void> {
  const { error } = await supabase.from("crm_project_phases").insert(
    names.map((name, index) => ({
      project_id: projectId,
      name,
      position: index,
      status: index === 0 ? "em_andamento" : "pendente",
      started_at: index === 0 ? new Date().toISOString() : null,
    })),
  );

  if (error) throw new Error(`Falha ao criar etapas padrão: ${error.message}`);
}

export interface UpdatePhasePayload {
  name?: string;
  position?: number;
  status?: ProjectPhaseStatus;
  startedAt?: string | null;
  dueAt?: string | null;
  completedAt?: string | null;
}

export async function updatePhase(
  supabase: SupabaseClient,
  id: string,
  patch: UpdatePhasePayload,
): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (patch.name !== undefined) payload.name = patch.name;
  if (patch.position !== undefined) payload.position = patch.position;
  if (patch.status !== undefined) payload.status = patch.status;
  if (patch.startedAt !== undefined) payload.started_at = patch.startedAt;
  if (patch.dueAt !== undefined) payload.due_at = patch.dueAt;
  if (patch.completedAt !== undefined) payload.completed_at = patch.completedAt;

  const { error } = await supabase.from("crm_project_phases").update(payload).eq("id", id);
  if (error) throw new Error(`Falha ao atualizar etapa: ${error.message}`);
}

export async function deletePhase(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("crm_project_phases").delete().eq("id", id);
  if (error) throw new Error(`Falha ao excluir etapa: ${error.message}`);
}
