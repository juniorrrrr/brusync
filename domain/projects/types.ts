import type { BadgeTone } from "@/types/crm";
import type {
  ProjectPhaseStatus,
  ProjectStatus,
  ProjectTaskPriority,
  ProjectTaskStatus,
} from "@/types/projects";

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  planejamento: "Planejamento",
  em_andamento: "Em andamento",
  pausado: "Pausado",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

export const PROJECT_STATUS_BADGE: Record<ProjectStatus, BadgeTone> = {
  planejamento: "info",
  em_andamento: "warn",
  pausado: "neutral",
  concluido: "ok",
  cancelado: "danger",
};

export const PROJECT_STATUSES: ProjectStatus[] = [
  "planejamento",
  "em_andamento",
  "pausado",
  "concluido",
  "cancelado",
];

export const PROJECT_PHASE_STATUS_LABEL: Record<ProjectPhaseStatus, string> = {
  pendente: "Pendente",
  em_andamento: "Em andamento",
  concluido: "Concluído",
};

export const PROJECT_PHASE_STATUS_BADGE: Record<ProjectPhaseStatus, BadgeTone> = {
  pendente: "neutral",
  em_andamento: "warn",
  concluido: "ok",
};

export const PROJECT_PHASE_STATUSES: ProjectPhaseStatus[] = [
  "pendente",
  "em_andamento",
  "concluido",
];

export const PROJECT_TASK_STATUS_LABEL: Record<ProjectTaskStatus, string> = {
  pendente: "Pendente",
  em_andamento: "Em andamento",
  concluido: "Concluído",
};

export const PROJECT_TASK_STATUS_BADGE: Record<ProjectTaskStatus, BadgeTone> = {
  pendente: "neutral",
  em_andamento: "warn",
  concluido: "ok",
};

export const PROJECT_TASK_STATUSES: ProjectTaskStatus[] = ["pendente", "em_andamento", "concluido"];

export const PROJECT_TASK_PRIORITY_LABEL: Record<ProjectTaskPriority, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
};

export const PROJECT_TASK_PRIORITY_BADGE: Record<ProjectTaskPriority, BadgeTone> = {
  baixa: "neutral",
  media: "info",
  alta: "warn",
};

export const PROJECT_TASK_PRIORITIES: ProjectTaskPriority[] = ["baixa", "media", "alta"];
