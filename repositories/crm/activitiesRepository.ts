import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { type LeadActivityRow, mapLeadActivity } from "@/repositories/crm/mappers";
import type { ActivityType, LeadActivity } from "@/types/crm";

const ACTIVITY_SELECT = `
  id, crm_lead_id, type, title, body, metadata, due_at, done, created_by, created_at,
  author:profiles!crm_lead_activities_created_by_fkey (id, name, email)
`;

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

export interface CreateActivityPayload {
  crmLeadId: string;
  type: ActivityType;
  title: string;
  body?: string | null;
  metadata?: Record<string, unknown> | null;
  createdBy: string | null;
}

/** Appends one entry to the immutable Timeline log. Called internally by
 * other actions (stage change, note/task CRUD, file upload, lead edit) —
 * never invoked directly from a user-facing "add activity" form, since the
 * Lead Workspace has no manual composer: every Timeline entry is a
 * system-recorded side effect of a real action. */
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
    created_by: payload.createdBy,
  });

  if (error) throw new Error(`Falha ao registrar atividade: ${error.message}`);
}
