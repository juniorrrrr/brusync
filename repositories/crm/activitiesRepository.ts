import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { type LeadActivityRow, mapLeadActivity } from "@/repositories/crm/mappers";
import type { ActivityType, LeadActivity } from "@/types/crm";

const ACTIVITY_SELECT = `
  id, crm_lead_id, type, title, body, metadata, due_at, done, created_by, created_at,
  author:profiles!crm_lead_activities_created_by_fkey (id, name, email)
`;

export async function listActivitiesForLead(
  supabase: SupabaseClient,
  crmLeadId: string,
): Promise<LeadActivity[]> {
  const { data, error } = await supabase
    .from("crm_lead_activities")
    .select(ACTIVITY_SELECT)
    .eq("crm_lead_id", crmLeadId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Falha ao carregar atividades: ${error.message}`);
  return ((data ?? []) as unknown as LeadActivityRow[]).map(mapLeadActivity);
}

export interface RecentActivity extends LeadActivity {
  leadName: string;
}

export async function listRecentActivities(
  supabase: SupabaseClient,
  limit = 8,
): Promise<RecentActivity[]> {
  const { data, error } = await supabase
    .from("crm_lead_activities")
    .select(`${ACTIVITY_SELECT}, lead:crm_leads!crm_lead_activities_crm_lead_id_fkey (name)`)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Falha ao carregar atividades recentes: ${error.message}`);

  return ((data ?? []) as unknown as (LeadActivityRow & { lead: { name: string } | null })[]).map(
    (row) => ({ ...mapLeadActivity(row), leadName: row.lead?.name ?? "Lead removido" }),
  );
}

export interface UpcomingTask extends LeadActivity {
  leadName: string;
}

export async function listUpcomingTasks(
  supabase: SupabaseClient,
  limit = 6,
): Promise<UpcomingTask[]> {
  const { data, error } = await supabase
    .from("crm_lead_activities")
    .select(`${ACTIVITY_SELECT}, lead:crm_leads!crm_lead_activities_crm_lead_id_fkey (name)`)
    .eq("type", "task")
    .eq("done", false)
    .order("due_at", { ascending: true, nullsFirst: false })
    .limit(limit);

  if (error) throw new Error(`Falha ao carregar tarefas: ${error.message}`);

  return ((data ?? []) as unknown as (LeadActivityRow & { lead: { name: string } | null })[]).map(
    (row) => ({ ...mapLeadActivity(row), leadName: row.lead?.name ?? "Lead removido" }),
  );
}

export interface CreateActivityPayload {
  crmLeadId: string;
  type: ActivityType;
  title: string;
  body?: string | null;
  metadata?: Record<string, unknown> | null;
  dueAt?: string | null;
  createdBy: string;
}

export async function createActivity(
  supabase: SupabaseClient,
  payload: CreateActivityPayload,
): Promise<void> {
  const { error } = await supabase.from("crm_lead_activities").insert({
    crm_lead_id: payload.crmLeadId,
    type: payload.type,
    title: payload.title,
    body: payload.body ?? null,
    metadata: payload.metadata ?? null,
    due_at: payload.dueAt ?? null,
    created_by: payload.createdBy,
  });

  if (error) throw new Error(`Falha ao registrar atividade: ${error.message}`);
}

export async function toggleTaskDone(
  supabase: SupabaseClient,
  activityId: string,
  done: boolean,
): Promise<void> {
  const { error } = await supabase
    .from("crm_lead_activities")
    .update({ done })
    .eq("id", activityId);

  if (error) throw new Error(`Falha ao atualizar tarefa: ${error.message}`);
}
