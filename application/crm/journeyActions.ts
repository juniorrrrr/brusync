"use server";

import { requireCrmProfile } from "@/application/crm/authGuard";
import { JOURNEY_STAGE_SCORE } from "@/domain/journey/stages";
import { getDemoJourneySummary } from "@/lib/demo/mockJourney";
import { countActivitiesForLead } from "@/repositories/crm/activitiesRepository";
import { createJourneyEvent, listJourneyEvents } from "@/repositories/crm/journeyRepository";
import { getLeadById } from "@/repositories/crm/leadsRepository";
import { recordJourneyEventSchema } from "@/schemas/crm/journey.schema";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { publishEvent } from "@/services/eventBus/eventBus";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type { JourneySummary } from "@/types/journey";

const DEMO_WRITE_BLOCKED_MESSAGE =
  "Ação indisponível em Modo Demonstração — nenhuma escrita é enviada ao banco.";

function firstIssueMessage(error: { issues: { message: string }[] }) {
  return error.issues[0]?.message ?? "Dados inválidos.";
}

export async function fetchJourneyData(crmLeadId: string): Promise<JourneySummary | null> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return getDemoJourneySummary(crmLeadId);

  const supabase = await getSupabaseAuthClient();
  const [events, activitiesCount, lead] = await Promise.all([
    listJourneyEvents(supabase, crmLeadId),
    countActivitiesForLead(supabase, crmLeadId),
    getLeadById(supabase, crmLeadId),
  ]);

  if (!lead) return null;

  const lastEvent = events[events.length - 1] ?? null;

  return {
    currentStage: lastEvent?.stage ?? null,
    score: lastEvent?.score ?? 0,
    timeInCurrentStageMs: lastEvent ? Date.now() - new Date(lastEvent.occurredAt).getTime() : null,
    totalTimeSinceCreationMs: Date.now() - new Date(lead.createdAt).getTime(),
    activitiesCount,
    changesCount: events.length,
    ownerName: lead.owner?.name ?? lead.owner?.email ?? null,
    lastMovementAt: lastEvent?.occurredAt ?? null,
    events,
  };
}

export interface RecordJourneyEventState {
  status: "idle" | "success" | "error";
  message?: string;
}

/** The manual side of the Motor de Conversões: lets someone log any of the
 * 13 journey milestones directly, with origin "manual" — complementary to
 * the "automatico" events already recorded as a side effect of real actions
 * (createLeadAction, moveLeadStageAction, markLeadLostAction).
 *
 * Also publishes a matching integration event (services/eventBus) for
 * "Reunião Agendada", "Proposta Enviada" and "Cliente Ativo" — the three new
 * event types added in this phase (MeetingScheduled, ProposalSent,
 * ClientActivated), whose payload is just `{ leadId }`. "Lead Qualificado",
 * "Venda Ganha" and "Venda Perdida" already publish their richer events
 * (LeadQualified/LeadWon/LeadLost, with stage/revenue/reason) from their own
 * dedicated actions since Fase 6 — this generic logger deliberately does not
 * re-publish those here, to avoid a second, less-detailed event for the same
 * transition. */
export async function recordJourneyEventAction(
  _prevState: RecordJourneyEventState,
  formData: FormData,
): Promise<RecordJourneyEventState> {
  const profile = await requireCrmProfile();
  if (await isDemoModeActive()) {
    return { status: "error", message: DEMO_WRITE_BLOCKED_MESSAGE };
  }

  const parsed = recordJourneyEventSchema.safeParse({
    crmLeadId: formData.get("crmLeadId"),
    stage: formData.get("stage"),
    note: formData.get("note") || undefined,
  });

  if (!parsed.success) {
    return { status: "error", message: firstIssueMessage(parsed.error) };
  }

  const supabase = await getSupabaseAuthClient();
  const { crmLeadId, stage, note } = parsed.data;

  await createJourneyEvent(supabase, {
    crmLeadId,
    stage,
    score: JOURNEY_STAGE_SCORE[stage],
    actorId: profile.id,
    origin: "manual",
    note: note ?? null,
  });

  if (stage === "reuniao_agendada") {
    await publishEvent(
      supabase,
      "MeetingScheduled",
      { leadId: crmLeadId },
      { entityId: crmLeadId, actorId: profile.id },
    );
  } else if (stage === "proposta_enviada") {
    await publishEvent(
      supabase,
      "ProposalSent",
      { leadId: crmLeadId },
      { entityId: crmLeadId, actorId: profile.id },
    );
  } else if (stage === "cliente_ativo") {
    await publishEvent(
      supabase,
      "ClientActivated",
      { leadId: crmLeadId },
      { entityId: crmLeadId, actorId: profile.id },
    );
  }

  return { status: "success", message: "Evento registrado na jornada." };
}
