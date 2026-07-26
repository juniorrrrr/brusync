import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProcessStepStatus } from "@/types/processes";

export interface ProcessStepRow {
  id: string;
  processId: string;
  name: string;
  description: string | null;
  position: number;
  status: ProcessStepStatus;
  startedAt: string | null;
  completedAt: string | null;
}

interface StepRow {
  id: string;
  process_id: string;
  name: string;
  description: string | null;
  position: number;
  status: ProcessStepStatus;
  started_at: string | null;
  completed_at: string | null;
}

const STEP_SELECT = "id, process_id, name, description, position, status, started_at, completed_at";

function mapStep(row: StepRow): ProcessStepRow {
  return {
    id: row.id,
    processId: row.process_id,
    name: row.name,
    description: row.description,
    position: row.position,
    status: row.status,
    startedAt: row.started_at,
    completedAt: row.completed_at,
  };
}

export async function listStepsForProcess(
  supabase: SupabaseClient,
  processId: string,
): Promise<ProcessStepRow[]> {
  const { data, error } = await supabase
    .from("crm_process_steps")
    .select(STEP_SELECT)
    .eq("process_id", processId)
    .order("position", { ascending: true });

  if (error) throw new Error(`Falha ao carregar etapas: ${error.message}`);
  return ((data ?? []) as StepRow[]).map(mapStep);
}

export interface CreateStepPayload {
  processId: string;
  name: string;
  description: string | null;
  position: number;
}

export async function createStep(
  supabase: SupabaseClient,
  payload: CreateStepPayload,
): Promise<ProcessStepRow> {
  const { data, error } = await supabase
    .from("crm_process_steps")
    .insert({
      process_id: payload.processId,
      name: payload.name,
      description: payload.description,
      position: payload.position,
    })
    .select(STEP_SELECT)
    .single();

  if (error) throw new Error(`Falha ao criar etapa: ${error.message}`);
  return mapStep(data as StepRow);
}

export interface UpdateStepStatusPayload {
  status: ProcessStepStatus;
  startedAt?: string | null;
  completedAt?: string | null;
}

export async function updateStepStatus(
  supabase: SupabaseClient,
  id: string,
  patch: UpdateStepStatusPayload,
): Promise<void> {
  const payload: Record<string, unknown> = { status: patch.status };
  if (patch.startedAt !== undefined) payload.started_at = patch.startedAt;
  if (patch.completedAt !== undefined) payload.completed_at = patch.completedAt;

  const { error } = await supabase.from("crm_process_steps").update(payload).eq("id", id);
  if (error) throw new Error(`Falha ao atualizar etapa: ${error.message}`);
}

export async function deleteStep(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("crm_process_steps").delete().eq("id", id);
  if (error) throw new Error(`Falha ao remover etapa: ${error.message}`);
}
