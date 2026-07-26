import type { BadgeTone } from "@/types/crm";
import type {
  ProcessApprovalStatus,
  ProcessCategoryColor,
  ProcessChecklistItemStatus,
  ProcessStatus,
  ProcessStepStatus,
} from "@/types/processes";

export const PROCESS_STATUS_LABEL: Record<ProcessStatus, string> = {
  rascunho: "Rascunho",
  ativo: "Ativo",
  pausado: "Pausado",
  aguardando_aprovacao: "Aguardando aprovação",
  concluido: "Concluído",
  arquivado: "Arquivado",
};

export const PROCESS_STATUS_BADGE: Record<ProcessStatus, BadgeTone> = {
  rascunho: "neutral",
  ativo: "info",
  pausado: "warn",
  aguardando_aprovacao: "warn",
  concluido: "ok",
  arquivado: "neutral",
};

export const PROCESS_STATUSES: ProcessStatus[] = [
  "rascunho",
  "ativo",
  "pausado",
  "aguardando_aprovacao",
  "concluido",
  "arquivado",
];

export const PROCESS_STEP_STATUS_LABEL: Record<ProcessStepStatus, string> = {
  pendente: "Pendente",
  em_andamento: "Em andamento",
  concluido: "Concluído",
};

export const PROCESS_STEP_STATUS_BADGE: Record<ProcessStepStatus, BadgeTone> = {
  pendente: "neutral",
  em_andamento: "warn",
  concluido: "ok",
};

export const PROCESS_CHECKLIST_STATUS_LABEL: Record<ProcessChecklistItemStatus, string> = {
  pendente: "Pendente",
  em_andamento: "Em andamento",
  concluido: "Concluído",
};

export const PROCESS_APPROVAL_STATUS_LABEL: Record<ProcessApprovalStatus, string> = {
  pendente: "Pendente",
  aprovado: "Aprovado",
  reprovado: "Reprovado",
};

export const PROCESS_APPROVAL_STATUS_BADGE: Record<ProcessApprovalStatus, BadgeTone> = {
  pendente: "warn",
  aprovado: "ok",
  reprovado: "danger",
};

export const PROCESS_CATEGORY_COLOR_TONE: Record<ProcessCategoryColor, BadgeTone> = {
  info: "info",
  warn: "warn",
  ok: "ok",
  neutral: "neutral",
  danger: "danger",
};

export const PROCESS_CATEGORY_COLORS: ProcessCategoryColor[] = [
  "info",
  "warn",
  "ok",
  "neutral",
  "danger",
];
