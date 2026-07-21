import type { ActivityType } from "@/types/crm";

export const ACTIVITY_TYPE_LABEL: Record<ActivityType, string> = {
  note: "Nota",
  stage_change: "Mudança de estágio",
  call: "Ligação",
  email: "E-mail",
  meeting: "Reunião",
  task: "Tarefa",
  system: "Sistema",
};

export function isPendingTask(activity: { type: ActivityType; done: boolean }) {
  return activity.type === "task" && !activity.done;
}
