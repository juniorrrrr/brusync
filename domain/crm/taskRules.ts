import type { BadgeTone, TaskPriority, TaskStatus } from "@/types/crm";

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  pending: "Pendente",
  in_progress: "Em andamento",
  done: "Concluída",
};

export const TASK_STATUS_BADGE: Record<TaskStatus, BadgeTone> = {
  pending: "neutral",
  in_progress: "info",
  done: "ok",
};

export const TASK_PRIORITY_LABEL: Record<TaskPriority, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
};

export const TASK_PRIORITY_BADGE: Record<TaskPriority, BadgeTone> = {
  low: "neutral",
  medium: "warn",
  high: "danger",
};

export function isTaskOverdue(task: { dueAt: string | null; status: TaskStatus }) {
  if (!task.dueAt || task.status === "done") return false;
  return new Date(task.dueAt).getTime() < Date.now();
}
