import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { JourneyEvent, JourneyEventOrigin, JourneyStage } from "@/types/journey";

interface JourneyEventRow {
  id: string;
  crm_lead_id: string;
  stage: JourneyStage;
  occurred_at: string;
  actor_id: string | null;
  origin: JourneyEventOrigin;
  note: string | null;
  score: number;
  created_at: string;
  actor?: { name: string | null; email: string | null } | null;
}

const JOURNEY_EVENT_SELECT =
  "id, crm_lead_id, stage, occurred_at, actor_id, origin, note, score, created_at, actor:profiles!crm_lead_journey_events_actor_id_fkey (name, email)";

function mapJourneyEvent(row: JourneyEventRow): JourneyEvent {
  return {
    id: row.id,
    crmLeadId: row.crm_lead_id,
    stage: row.stage,
    occurredAt: row.occurred_at,
    actorId: row.actor_id,
    actorName: row.actor?.name ?? row.actor?.email ?? null,
    origin: row.origin,
    note: row.note,
    score: row.score,
    createdAt: row.created_at,
  };
}

export async function listJourneyEvents(
  supabase: SupabaseClient,
  crmLeadId: string,
): Promise<JourneyEvent[]> {
  const { data, error } = await supabase
    .from("crm_lead_journey_events")
    .select(JOURNEY_EVENT_SELECT)
    .eq("crm_lead_id", crmLeadId)
    .order("occurred_at", { ascending: true });

  if (error) throw new Error(`Falha ao carregar jornada do lead: ${error.message}`);
  return ((data ?? []) as unknown as JourneyEventRow[]).map(mapJourneyEvent);
}

export interface CreateJourneyEventPayload {
  crmLeadId: string;
  stage: JourneyStage;
  score: number;
  actorId: string | null;
  origin: JourneyEventOrigin;
  note?: string | null;
  occurredAt?: string;
}

/** Append-only insert — there is deliberately no update/delete function here.
 * A journey event, once recorded, is a permanent part of the lead's history
 * (enforced twice over: no RLS policy allows update/delete on this table
 * either — see the Fase 7 migration). */
export async function createJourneyEvent(
  supabase: SupabaseClient,
  payload: CreateJourneyEventPayload,
): Promise<JourneyEvent> {
  const { data, error } = await supabase
    .from("crm_lead_journey_events")
    .insert({
      crm_lead_id: payload.crmLeadId,
      stage: payload.stage,
      score: payload.score,
      actor_id: payload.actorId,
      origin: payload.origin,
      note: payload.note ?? null,
      occurred_at: payload.occurredAt ?? new Date().toISOString(),
    })
    .select(JOURNEY_EVENT_SELECT)
    .single();

  if (error) throw new Error(`Falha ao registrar evento da jornada: ${error.message}`);
  return mapJourneyEvent(data as unknown as JourneyEventRow);
}
