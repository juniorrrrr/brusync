import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AgendaEvent, AgendaEventStatus, AgendaEventType, AgendaHealth } from "@/types/agenda";

interface AgendaEventRow {
  id: string;
  crm_lead_id: string | null;
  title: string;
  description: string | null;
  event_type: AgendaEventType;
  scheduled_at: string;
  duration_minutes: number | null;
  status: AgendaEventStatus;
  completed_at: string | null;
  owner_id: string | null;
  created_at: string;
  updated_at: string;
  lead?: { name: string; stage: { key: string } | null } | null;
  owner?: { name: string | null; email: string | null } | null;
}

const AGENDA_EVENT_SELECT = `
  id, crm_lead_id, title, description, event_type, scheduled_at, duration_minutes, status, completed_at, owner_id, created_at, updated_at,
  lead:crm_leads!crm_agenda_events_crm_lead_id_fkey (name, stage:pipeline_stages!crm_leads_stage_id_fkey (key)),
  owner:profiles!crm_agenda_events_owner_id_fkey (name, email)
`;

function mapAgendaEvent(row: AgendaEventRow): AgendaEvent {
  return {
    id: row.id,
    crmLeadId: row.crm_lead_id,
    leadName: row.lead?.name ?? null,
    stageKey: row.lead?.stage?.key ?? null,
    title: row.title,
    description: row.description,
    eventType: row.event_type,
    scheduledAt: row.scheduled_at,
    durationMinutes: row.duration_minutes,
    status: row.status,
    completedAt: row.completed_at,
    ownerId: row.owner_id,
    ownerName: row.owner?.name ?? row.owner?.email ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface ListAgendaEventsOptions {
  scheduledFrom?: string;
  scheduledTo?: string;
  status?: AgendaEventStatus;
  ownerId?: string;
  stageKey?: string;
  crmLeadId?: string;
  eventType?: AgendaEventType;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface AgendaEventsPage {
  events: AgendaEvent[];
  total: number;
}

export async function listAgendaEvents(
  supabase: SupabaseClient,
  options: ListAgendaEventsOptions = {},
): Promise<AgendaEventsPage> {
  let query = supabase.from("crm_agenda_events").select(AGENDA_EVENT_SELECT, { count: "exact" });

  if (options.scheduledFrom) query = query.gte("scheduled_at", options.scheduledFrom);
  if (options.scheduledTo) query = query.lt("scheduled_at", options.scheduledTo);
  if (options.status) query = query.eq("status", options.status);
  if (options.ownerId) query = query.eq("owner_id", options.ownerId);
  if (options.crmLeadId) query = query.eq("crm_lead_id", options.crmLeadId);
  if (options.eventType) query = query.eq("event_type", options.eventType);

  const { data, error, count } = await query
    .order("scheduled_at", { ascending: true })
    .range(options.offset ?? 0, (options.offset ?? 0) + (options.limit ?? 100) - 1);

  if (error) throw new Error(`Falha ao carregar agenda: ${error.message}`);

  let events = ((data ?? []) as unknown as AgendaEventRow[]).map(mapAgendaEvent);

  // Stage/search filters need the joined lead, so they're applied in JS
  // after the query — same approach used across the app (conversion_events'
  // destination/status filters, automation_workflows' trigger filter).
  if (options.stageKey) events = events.filter((e) => e.stageKey === options.stageKey);
  if (options.search) {
    const term = options.search.toLowerCase();
    events = events.filter(
      (e) => e.title.toLowerCase().includes(term) || e.leadName?.toLowerCase().includes(term),
    );
  }

  return { events, total: count ?? events.length };
}

/** Chronological agenda of a single lead — every past and future commercial
 * event, oldest first, powering the Lead Workspace's Agenda tab. */
export async function listAgendaEventsForLead(
  supabase: SupabaseClient,
  crmLeadId: string,
): Promise<AgendaEvent[]> {
  const { data, error } = await supabase
    .from("crm_agenda_events")
    .select(AGENDA_EVENT_SELECT)
    .eq("crm_lead_id", crmLeadId)
    .order("scheduled_at", { ascending: true });

  if (error) throw new Error(`Falha ao carregar agenda do lead: ${error.message}`);
  return ((data ?? []) as unknown as AgendaEventRow[]).map(mapAgendaEvent);
}

export async function getAgendaEventById(
  supabase: SupabaseClient,
  id: string,
): Promise<AgendaEvent | null> {
  const { data, error } = await supabase
    .from("crm_agenda_events")
    .select(AGENDA_EVENT_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Falha ao carregar evento da agenda: ${error.message}`);
  return data ? mapAgendaEvent(data as unknown as AgendaEventRow) : null;
}

export interface CreateAgendaEventPayload {
  crmLeadId: string | null;
  title: string;
  description: string | null;
  eventType: AgendaEventType;
  scheduledAt: string;
  durationMinutes: number | null;
  ownerId: string | null;
  createdBy: string | null;
}

export async function createAgendaEvent(
  supabase: SupabaseClient,
  payload: CreateAgendaEventPayload,
): Promise<AgendaEvent> {
  const { data, error } = await supabase
    .from("crm_agenda_events")
    .insert({
      crm_lead_id: payload.crmLeadId,
      title: payload.title,
      description: payload.description,
      event_type: payload.eventType,
      scheduled_at: payload.scheduledAt,
      duration_minutes: payload.durationMinutes,
      owner_id: payload.ownerId,
      created_by: payload.createdBy,
    })
    .select(AGENDA_EVENT_SELECT)
    .single();

  if (error) throw new Error(`Falha ao criar evento da agenda: ${error.message}`);
  return mapAgendaEvent(data as unknown as AgendaEventRow);
}

export interface UpdateAgendaEventPayload {
  title?: string;
  description?: string | null;
  eventType?: AgendaEventType;
  scheduledAt?: string;
  durationMinutes?: number | null;
  ownerId?: string | null;
}

export async function updateAgendaEvent(
  supabase: SupabaseClient,
  id: string,
  patch: UpdateAgendaEventPayload,
): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (patch.title !== undefined) payload.title = patch.title;
  if (patch.description !== undefined) payload.description = patch.description;
  if (patch.eventType !== undefined) payload.event_type = patch.eventType;
  if (patch.scheduledAt !== undefined) payload.scheduled_at = patch.scheduledAt;
  if (patch.durationMinutes !== undefined) payload.duration_minutes = patch.durationMinutes;
  if (patch.ownerId !== undefined) payload.owner_id = patch.ownerId;

  const { error } = await supabase.from("crm_agenda_events").update(payload).eq("id", id);
  if (error) throw new Error(`Falha ao atualizar evento da agenda: ${error.message}`);
}

export async function completeAgendaEvent(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase
    .from("crm_agenda_events")
    .update({ status: "concluido", completed_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(`Falha ao concluir evento da agenda: ${error.message}`);
}

export async function cancelAgendaEvent(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase
    .from("crm_agenda_events")
    .update({ status: "cancelado" })
    .eq("id", id);

  if (error) throw new Error(`Falha ao cancelar evento da agenda: ${error.message}`);
}

export async function deleteAgendaEvent(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("crm_agenda_events").delete().eq("id", id);
  if (error) throw new Error(`Falha ao excluir evento da agenda: ${error.message}`);
}

export async function getAgendaHealthStats(supabase: SupabaseClient): Promise<AgendaHealth> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startOfTomorrow = new Date(startOfDay);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
  const now = new Date().toISOString();

  const [todayRes, overdueRes, meetingsRes, followUpsRes, completedRes] = await Promise.all([
    supabase
      .from("crm_agenda_events")
      .select("*", { count: "exact", head: true })
      .gte("scheduled_at", startOfDay.toISOString())
      .lt("scheduled_at", startOfTomorrow.toISOString()),
    supabase
      .from("crm_agenda_events")
      .select("*", { count: "exact", head: true })
      .eq("status", "agendado")
      .lt("scheduled_at", now),
    supabase
      .from("crm_agenda_events")
      .select("*", { count: "exact", head: true })
      .eq("event_type", "reuniao")
      .gte("scheduled_at", startOfDay.toISOString())
      .lt("scheduled_at", startOfTomorrow.toISOString()),
    supabase
      .from("crm_agenda_events")
      .select("*", { count: "exact", head: true })
      .eq("event_type", "follow_up")
      .eq("status", "agendado"),
    supabase.from("crm_agenda_events").select("status, scheduled_at, completed_at"),
  ]);

  if (todayRes.error) throw new Error(`Falha ao calcular indicadores: ${todayRes.error.message}`);
  if (overdueRes.error)
    throw new Error(`Falha ao calcular indicadores: ${overdueRes.error.message}`);
  if (meetingsRes.error)
    throw new Error(`Falha ao calcular indicadores: ${meetingsRes.error.message}`);
  if (followUpsRes.error)
    throw new Error(`Falha ao calcular indicadores: ${followUpsRes.error.message}`);
  if (completedRes.error)
    throw new Error(`Falha ao calcular indicadores: ${completedRes.error.message}`);

  const rows = (completedRes.data ?? []) as {
    status: AgendaEventStatus;
    scheduled_at: string;
    completed_at: string | null;
  }[];
  const finished = rows.filter((r) => r.status === "concluido" || r.status === "cancelado");
  const completed = rows.filter((r) => r.status === "concluido" && r.completed_at);

  const completionRate = finished.length > 0 ? (completed.length / finished.length) * 100 : null;

  const averageTimeToCompleteMs =
    completed.length > 0
      ? Math.round(
          completed.reduce(
            (sum, r) =>
              sum +
              (new Date(r.completed_at as string).getTime() - new Date(r.scheduled_at).getTime()),
            0,
          ) / completed.length,
        )
      : null;

  return {
    activitiesToday: todayRes.count ?? 0,
    overdue: overdueRes.count ?? 0,
    meetingsToday: meetingsRes.count ?? 0,
    pendingFollowUps: followUpsRes.count ?? 0,
    completionRate,
    averageTimeToCompleteMs,
  };
}
