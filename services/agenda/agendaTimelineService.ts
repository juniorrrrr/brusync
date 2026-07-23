import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { AGENDA_EVENT_TYPE_TO_ACTIVITY_TYPE } from "@/domain/agenda/timelineMap";
import { AGENDA_EVENT_TYPE_LABEL } from "@/domain/agenda/types";
import { createActivity } from "@/repositories/crm/activitiesRepository";
import type { AgendaEvent } from "@/types/agenda";

type AgendaTimelineAction = "agendada" | "concluida" | "cancelada";

/** "Cada ação deverá registrar automaticamente um evento na timeline do
 * Lead" — the only place the Agenda writes into the existing, unmodified
 * public.crm_lead_activities table. Silently a no-op for events with no
 * lead attached (a lead-less agenda item has no timeline to write to).
 * Never throws: a failure here must never undo the agenda action itself. */
export async function recordAgendaTimelineEntry(
  supabase: SupabaseClient,
  event: AgendaEvent,
  action: AgendaTimelineAction,
  actorId: string | null,
): Promise<void> {
  if (!event.crmLeadId) return;

  const label = AGENDA_EVENT_TYPE_LABEL[event.eventType];
  const verb =
    action === "agendada" ? "agendada" : action === "concluida" ? "concluída" : "cancelada";

  try {
    await createActivity(supabase, {
      crmLeadId: event.crmLeadId,
      type: AGENDA_EVENT_TYPE_TO_ACTIVITY_TYPE[event.eventType],
      title: `${label} ${verb}: ${event.title}`,
      body: event.description,
      metadata: { agendaEventId: event.id, scheduledAt: event.scheduledAt },
      createdBy: actorId,
    });
  } catch (err) {
    console.error("agendaTimelineService: falha ao registrar na timeline do lead", err);
  }
}
