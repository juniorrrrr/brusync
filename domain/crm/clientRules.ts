import type { BadgeTone, ClientStatus } from "@/types/crm";

export const CLIENT_STATUS_LABEL: Record<ClientStatus, string> = {
  ativo: "Ativo",
  inativo: "Inativo",
  em_risco: "Em risco",
};

export const CLIENT_STATUS_BADGE: Record<ClientStatus, BadgeTone> = {
  ativo: "ok",
  inativo: "neutral",
  em_risco: "danger",
};
