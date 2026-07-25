import type { PlaybookCategory, PlaybookStatus } from "@/types/playbooks";

export const PLAYBOOK_STATUS_LABEL: Record<PlaybookStatus, string> = {
  rascunho: "Rascunho",
  ativo: "Ativo",
  em_revisao: "Em revisão",
  arquivado: "Arquivado",
};

export const PLAYBOOK_STATUS_BADGE: Record<PlaybookStatus, string> = {
  rascunho: "neutral",
  ativo: "ok",
  em_revisao: "warn",
  arquivado: "neutral",
};

export const PLAYBOOK_CATEGORY_LABEL: Record<PlaybookCategory, string> = {
  primeiro_contato: "Primeiro contato",
  diagnostico: "Diagnóstico",
  reuniao: "Reunião",
  proposta: "Proposta",
  negociacao: "Negociação",
  follow_up: "Follow-up",
  implantacao: "Implantação",
  pos_venda: "Pós-venda",
  renovacao: "Renovação",
};
