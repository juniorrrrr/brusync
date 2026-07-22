export type JourneyStage =
  | "novo_lead"
  | "primeiro_contato"
  | "contato_realizado"
  | "lead_qualificado"
  | "lead_desqualificado"
  | "reuniao_agendada"
  | "diagnostico"
  | "proposta_enviada"
  | "negociacao"
  | "venda_ganha"
  | "venda_perdida"
  | "implantacao"
  | "cliente_ativo";

export type JourneyEventOrigin = "manual" | "automatico" | "sistema";

export interface JourneyEvent {
  id: string;
  crmLeadId: string;
  stage: JourneyStage;
  occurredAt: string;
  actorId: string | null;
  actorName: string | null;
  origin: JourneyEventOrigin;
  note: string | null;
  score: number;
  createdAt: string;
}

/** Powers the Lead Workspace's "Jornada Comercial" section. */
export interface JourneySummary {
  currentStage: JourneyStage | null;
  score: number;
  timeInCurrentStageMs: number | null;
  totalTimeSinceCreationMs: number;
  activitiesCount: number;
  changesCount: number;
  ownerName: string | null;
  lastMovementAt: string | null;
  events: JourneyEvent[];
}
