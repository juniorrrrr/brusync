import type {
  AgendaEventStatus,
  AgendaEventType,
  AgendaRangeFilter,
  ReminderStatus,
} from "@/types/agenda";
import type { BadgeTone } from "@/types/crm";

export const AGENDA_EVENT_TYPE_LABEL: Record<AgendaEventType, string> = {
  ligacao: "Ligação",
  reuniao: "Reunião",
  follow_up: "Follow-up",
  proposta: "Proposta",
  implantacao: "Implantação",
  outro: "Outro",
};

export const AGENDA_EVENT_TYPE_BADGE: Record<AgendaEventType, BadgeTone> = {
  ligacao: "info",
  reuniao: "warn",
  follow_up: "neutral",
  proposta: "ok",
  implantacao: "info",
  outro: "neutral",
};

export const AGENDA_EVENT_TYPES: AgendaEventType[] = [
  "ligacao",
  "reuniao",
  "follow_up",
  "proposta",
  "implantacao",
  "outro",
];

export const AGENDA_EVENT_STATUS_LABEL: Record<AgendaEventStatus, string> = {
  agendado: "Agendado",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

export const AGENDA_EVENT_STATUS_BADGE: Record<AgendaEventStatus, BadgeTone> = {
  agendado: "info",
  concluido: "ok",
  cancelado: "neutral",
};

export const REMINDER_STATUS_LABEL: Record<ReminderStatus, string> = {
  pendente: "Pendente",
  concluido: "Concluído",
  dispensado: "Dispensado",
};

export const AGENDA_RANGE_LABEL: Record<AgendaRangeFilter, string> = {
  hoje: "Hoje",
  amanha: "Amanhã",
  "7dias": "Próximos 7 dias",
  atrasados: "Atrasados",
  concluidos: "Concluídos",
};

export const AGENDA_RANGE_FILTERS: AgendaRangeFilter[] = [
  "hoje",
  "amanha",
  "7dias",
  "atrasados",
  "concluidos",
];
