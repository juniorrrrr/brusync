import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AgendaReminder, ReminderStatus } from "@/types/agenda";

interface ReminderRow {
  id: string;
  crm_lead_id: string | null;
  agenda_event_id: string | null;
  message: string;
  remind_at: string;
  status: ReminderStatus;
  owner_id: string | null;
  created_at: string;
  lead?: { name: string } | null;
}

const REMINDER_SELECT = `
  id, crm_lead_id, agenda_event_id, message, remind_at, status, owner_id, created_at,
  lead:crm_leads!crm_reminders_crm_lead_id_fkey (name)
`;

function mapReminder(row: ReminderRow): AgendaReminder {
  return {
    id: row.id,
    crmLeadId: row.crm_lead_id,
    leadName: row.lead?.name ?? null,
    agendaEventId: row.agenda_event_id,
    message: row.message,
    remindAt: row.remind_at,
    status: row.status,
    ownerId: row.owner_id,
    createdAt: row.created_at,
  };
}

export interface ListRemindersOptions {
  status?: ReminderStatus;
  crmLeadId?: string;
  limit?: number;
}

export async function listReminders(
  supabase: SupabaseClient,
  options: ListRemindersOptions = {},
): Promise<AgendaReminder[]> {
  let query = supabase.from("crm_reminders").select(REMINDER_SELECT);

  if (options.status) query = query.eq("status", options.status);
  if (options.crmLeadId) query = query.eq("crm_lead_id", options.crmLeadId);

  const { data, error } = await query
    .order("remind_at", { ascending: true })
    .limit(options.limit ?? 50);

  if (error) throw new Error(`Falha ao carregar lembretes: ${error.message}`);
  return ((data ?? []) as unknown as ReminderRow[]).map(mapReminder);
}

export interface CreateReminderPayload {
  crmLeadId: string | null;
  agendaEventId: string | null;
  message: string;
  remindAt: string;
  ownerId: string | null;
  createdBy: string | null;
}

export async function createReminder(
  supabase: SupabaseClient,
  payload: CreateReminderPayload,
): Promise<void> {
  const { error } = await supabase.from("crm_reminders").insert({
    crm_lead_id: payload.crmLeadId,
    agenda_event_id: payload.agendaEventId,
    message: payload.message,
    remind_at: payload.remindAt,
    owner_id: payload.ownerId,
    created_by: payload.createdBy,
  });

  if (error) throw new Error(`Falha ao criar lembrete: ${error.message}`);
}

export async function updateReminderStatus(
  supabase: SupabaseClient,
  id: string,
  status: ReminderStatus,
): Promise<void> {
  const { error } = await supabase.from("crm_reminders").update({ status }).eq("id", id);
  if (error) throw new Error(`Falha ao atualizar lembrete: ${error.message}`);
}

export async function deleteReminder(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("crm_reminders").delete().eq("id", id);
  if (error) throw new Error(`Falha ao excluir lembrete: ${error.message}`);
}
