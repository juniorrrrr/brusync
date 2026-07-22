import { JOURNEY_STAGE_SCORE } from "@/domain/journey/stages";
import {
  DEMO_LEADS,
  DEMO_OWNERS,
  DEMO_PIPELINE_STAGES,
  type DemoLeadSeed,
} from "@/lib/demo/mockSeed";
import type { JourneyEvent, JourneyStage, JourneySummary } from "@/types/journey";

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

export function ownerName(seed: DemoLeadSeed): string | null {
  if (seed.ownerIndex === null) return null;
  return DEMO_OWNERS[seed.ownerIndex]?.name ?? null;
}

/** Which journey milestones a demo lead has "really" passed through, purely
 * as a function of its current pipeline stage / lost status — deterministic,
 * so the same demo lead always shows the same story. */
function stepsFor(seed: DemoLeadSeed): JourneyStage[] {
  if (seed.lost) {
    return ["novo_lead", "primeiro_contato", "venda_perdida"];
  }

  const stage = DEMO_PIPELINE_STAGES.find((s) => s.key === seed.stageKey);
  const position = stage?.position ?? 1;

  const steps: JourneyStage[] = ["novo_lead"];
  if (position >= 2) steps.push("primeiro_contato", "contato_realizado");
  if (position >= 3) steps.push("lead_qualificado");
  if (position >= 4) steps.push("reuniao_agendada", "diagnostico", "proposta_enviada");
  if (stage?.isWon) steps.push("negociacao", "venda_ganha", "implantacao", "cliente_ativo");
  return steps;
}

export function buildJourneyEvents(seed: DemoLeadSeed): JourneyEvent[] {
  const steps = stepsFor(seed);
  const endDaysAgo = seed.lost
    ? seed.lost.daysAgo
    : seed.stageKey === "fechado"
      ? 0
      : seed.daysInStage;
  const span = seed.daysAgoCreated - endDaysAgo;

  return steps.map((stage, index) => {
    const daysAgo =
      steps.length <= 1
        ? seed.daysAgoCreated
        : seed.daysAgoCreated - (span * index) / (steps.length - 1);

    return {
      id: `00000000-d002-4000-8000-${String(index + 1).padStart(6, "0")}${seed.id.slice(-6)}`,
      crmLeadId: seed.id,
      stage,
      occurredAt: daysAgoIso(Math.max(daysAgo, 0)),
      actorId: null,
      actorName: ownerName(seed),
      origin: index === 0 ? "sistema" : "automatico",
      note: null,
      score: JOURNEY_STAGE_SCORE[stage],
      createdAt: daysAgoIso(Math.max(daysAgo, 0)),
    };
  });
}

export function getDemoJourneySummary(leadId: string): JourneySummary | null {
  const seed = DEMO_LEADS.find((lead) => lead.id === leadId);
  if (!seed) return null;

  const events = buildJourneyEvents(seed);
  const lastEvent = events[events.length - 1] ?? null;
  const firstEvent = events[0] ?? null;

  return {
    currentStage: lastEvent?.stage ?? null,
    score: lastEvent?.score ?? 0,
    timeInCurrentStageMs: lastEvent ? Date.now() - new Date(lastEvent.occurredAt).getTime() : null,
    totalTimeSinceCreationMs: firstEvent
      ? Date.now() - new Date(firstEvent.occurredAt).getTime()
      : 0,
    activitiesCount: Math.max(1, events.length - 1),
    changesCount: events.length,
    ownerName: ownerName(seed),
    lastMovementAt: lastEvent?.occurredAt ?? null,
    events,
  };
}
