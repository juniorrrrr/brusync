import type { EventType } from "@/domain/events/types";
import type { JourneyStage } from "@/types/journey";

/** Canonical order of the commercial journey — the exact sequence given in
 * the Fase 7 spec. Used to render the "add event" picker in that order and
 * as a stable sort key when two events share the same `occurredAt`. */
export const JOURNEY_STAGE_ORDER: JourneyStage[] = [
  "novo_lead",
  "primeiro_contato",
  "contato_realizado",
  "lead_qualificado",
  "lead_desqualificado",
  "reuniao_agendada",
  "diagnostico",
  "proposta_enviada",
  "negociacao",
  "venda_ganha",
  "venda_perdida",
  "implantacao",
  "cliente_ativo",
];

export const JOURNEY_STAGE_LABEL: Record<JourneyStage, string> = {
  novo_lead: "Novo Lead",
  primeiro_contato: "Primeiro Contato",
  contato_realizado: "Contato Realizado",
  lead_qualificado: "Lead Qualificado",
  lead_desqualificado: "Lead Desqualificado",
  reuniao_agendada: "Reunião Agendada",
  diagnostico: "Diagnóstico",
  proposta_enviada: "Proposta Enviada",
  negociacao: "Negociação",
  venda_ganha: "Venda Ganha",
  venda_perdida: "Venda Perdida",
  implantacao: "Implantação",
  cliente_ativo: "Cliente Ativo",
};

/** Score Comercial por etapa (0-100). Novo Lead=10, Primeiro Contato=20,
 * Qualificado=40, Diagnóstico=60, Proposta=80 e Venda=100 são os valores
 * dados explicitamente na especificação da Fase 7; as demais etapas
 * preenchem os intervalos de forma monotônica ao longo do caminho positivo
 * da jornada. Etapas terminais negativas (desqualificado/perdida) zeram o
 * score — não há valor comercial remanescente a partir delas. */
export const JOURNEY_STAGE_SCORE: Record<JourneyStage, number> = {
  novo_lead: 10,
  primeiro_contato: 20,
  contato_realizado: 30,
  lead_qualificado: 40,
  lead_desqualificado: 0,
  reuniao_agendada: 50,
  diagnostico: 60,
  proposta_enviada: 80,
  negociacao: 90,
  venda_ganha: 100,
  venda_perdida: 0,
  implantacao: 100,
  cliente_ativo: 100,
};

/** Only these transitions are "important" enough to also publish through the
 * Event Bus (services/eventBus) built in Fase 6 — exactly the 6 examples
 * named in the Fase 7 spec's "Motor de Eventos" section. Every other journey
 * stage is still recorded in full in crm_lead_journey_events; it just has no
 * corresponding external-facing event yet. */
export const JOURNEY_STAGE_EVENT_TYPE: Partial<Record<JourneyStage, EventType>> = {
  lead_qualificado: "LeadQualified",
  venda_perdida: "LeadLost",
  venda_ganha: "LeadWon",
  proposta_enviada: "ProposalSent",
  reuniao_agendada: "MeetingScheduled",
  cliente_ativo: "ClientActivated",
};

/** Maps a Pipeline (Kanban) stage — the 5-stage novo/contato/qualificado/
 * proposta/fechado funnel that already exists — onto the richer 13-stage
 * journey, so moving a card automatically also logs the matching journey
 * milestone. Returns null for pipeline stages with no clean 1:1 journey
 * equivalent (there is none for "novo": that milestone is already logged
 * once, at lead creation). */
export function journeyStageForPipelineStage(
  stageKey: string,
  isWon: boolean,
): JourneyStage | null {
  if (isWon) return "venda_ganha";
  switch (stageKey) {
    case "contato":
      return "primeiro_contato";
    case "qualificado":
      return "lead_qualificado";
    case "proposta":
      return "proposta_enviada";
    default:
      return null;
  }
}
