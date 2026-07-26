import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProcessChecklistItem, ProcessChecklistItemStatus } from "@/types/processes";

interface ChecklistItemRow {
  id: string;
  process_id: string;
  step_id: string | null;
  label: string;
  position: number;
  status: ProcessChecklistItemStatus;
  completed_at: string | null;
  created_at: string;
  completed_by_profile?: { name: string | null; email: string | null } | null;
}

const CHECKLIST_SELECT = `
  id, process_id, step_id, label, position, status, completed_at, created_at,
  completed_by_profile:profiles!crm_process_checklist_items_completed_by_fkey(name, email)
`;

function mapItem(row: ChecklistItemRow): ProcessChecklistItem {
  return {
    id: row.id,
    processId: row.process_id,
    stepId: row.step_id,
    label: row.label,
    position: row.position,
    status: row.status,
    completedAt: row.completed_at,
    completedByName: row.completed_by_profile?.name ?? row.completed_by_profile?.email ?? null,
    createdAt: row.created_at,
  };
}

export async function listChecklistForProcess(
  supabase: SupabaseClient,
  processId: string,
): Promise<ProcessChecklistItem[]> {
  const { data, error } = await supabase
    .from("crm_process_checklist_items")
    .select(CHECKLIST_SELECT)
    .eq("process_id", processId)
    .order("position", { ascending: true });

  if (error) throw new Error(`Falha ao carregar checklist: ${error.message}`);
  return ((data ?? []) as unknown as ChecklistItemRow[]).map(mapItem);
}

export interface CreateChecklistItemPayload {
  processId: string;
  stepId: string | null;
  label: string;
  position: number;
}

export async function createChecklistItem(
  supabase: SupabaseClient,
  payload: CreateChecklistItemPayload,
): Promise<ProcessChecklistItem> {
  const { data, error } = await supabase
    .from("crm_process_checklist_items")
    .insert({
      process_id: payload.processId,
      step_id: payload.stepId,
      label: payload.label,
      position: payload.position,
    })
    .select(CHECKLIST_SELECT)
    .single();

  if (error) throw new Error(`Falha ao criar item de checklist: ${error.message}`);
  return mapItem(data as unknown as ChecklistItemRow);
}

export interface UpdateChecklistItemStatusPayload {
  status: ProcessChecklistItemStatus;
  completedAt: string | null;
  completedBy: string | null;
}

export async function updateChecklistItemStatus(
  supabase: SupabaseClient,
  id: string,
  patch: UpdateChecklistItemStatusPayload,
): Promise<ProcessChecklistItem> {
  const { data, error } = await supabase
    .from("crm_process_checklist_items")
    .update({
      status: patch.status,
      completed_at: patch.completedAt,
      completed_by: patch.completedBy,
    })
    .eq("id", id)
    .select(CHECKLIST_SELECT)
    .single();

  if (error) throw new Error(`Falha ao atualizar item de checklist: ${error.message}`);
  return mapItem(data as unknown as ChecklistItemRow);
}

export async function deleteChecklistItem(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("crm_process_checklist_items").delete().eq("id", id);
  if (error) throw new Error(`Falha ao remover item de checklist: ${error.message}`);
}
