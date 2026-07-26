import type {
  TeamCheckinStatus,
  TeamFeedbackType,
  TeamMemberStatus,
  TeamTimeOffStatus,
} from "@/types/team";

export const MEMBER_STATUS_LABEL: Record<TeamMemberStatus, string> = {
  ativo: "Ativo",
  ferias: "Em férias",
  afastado: "Afastado",
  inativo: "Inativo",
};

export const MEMBER_STATUS_BADGE: Record<TeamMemberStatus, string> = {
  ativo: "ok",
  ferias: "info",
  afastado: "warn",
  inativo: "neutral",
};

export const FEEDBACK_TYPE_LABEL: Record<TeamFeedbackType, string> = {
  elogio: "Elogio",
  construtivo: "Construtivo",
  alerta: "Alerta",
  reconhecimento: "Reconhecimento",
};

export const FEEDBACK_TYPE_BADGE: Record<TeamFeedbackType, string> = {
  elogio: "ok",
  construtivo: "info",
  alerta: "danger",
  reconhecimento: "ok",
};

export const CHECKIN_TYPE_LABEL: Record<string, string> = {
  "1_1": "1:1",
  reuniao: "Reunião",
  avaliacao: "Avaliação",
  alinhamento: "Alinhamento",
};

export const CHECKIN_STATUS_LABEL: Record<TeamCheckinStatus, string> = {
  agendado: "Agendado",
  realizado: "Realizado",
  cancelado: "Cancelado",
};

export const CHECKIN_STATUS_BADGE: Record<TeamCheckinStatus, string> = {
  agendado: "info",
  realizado: "ok",
  cancelado: "neutral",
};

export const TIME_OFF_TYPE_LABEL: Record<string, string> = {
  ferias: "Férias",
  licenca: "Licença",
  folga: "Folga",
  atestado: "Atestado",
};

export const TIME_OFF_STATUS_LABEL: Record<TeamTimeOffStatus, string> = {
  solicitado: "Solicitado",
  aprovado: "Aprovado",
  rejeitado: "Rejeitado",
  concluido: "Concluído",
};

export const TIME_OFF_STATUS_BADGE: Record<TeamTimeOffStatus, string> = {
  solicitado: "warn",
  aprovado: "ok",
  rejeitado: "danger",
  concluido: "neutral",
};
