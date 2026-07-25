import type {
  OperationsNextAction,
  OperationsPriority,
  OperationsQueueItem,
} from "@/types/operations";

const URGENT_WINDOW_HOURS = 24;

/** Overdue is always "alta"; due within the next 24h is "media"; anything
 * further out (or with no due date at all) is "baixa" — the single place
 * that decides urgency, so every queue item and next action agrees. */
export function computeActionPriority(dueAt: string | null, overdue: boolean): OperationsPriority {
  if (overdue) return "alta";
  if (!dueAt) return "baixa";
  const hoursUntil = (new Date(dueAt).getTime() - Date.now()) / 3_600_000;
  if (hoursUntil <= URGENT_WINDOW_HOURS) return "media";
  return "baixa";
}

const ACTION_VERB: Record<OperationsQueueItem["type"], (item: OperationsQueueItem) => string> = {
  call: (i) => `Ligar para ${i.title}`,
  followup: (i) => `Fazer follow-up com ${i.title}`,
  meeting: (i) => `Comparecer: ${i.title}`,
  task: (i) => i.title,
  approval: (i) => `Aprovar: ${i.title}`,
  project: (i) => `Concluir projeto: ${i.title}`,
  client: (i) => `Entrar em contato com ${i.title}`,
  lead: (i) => `Priorizar lead: ${i.title}`,
};

const REASON_BY_TYPE: Record<OperationsQueueItem["type"], string> = {
  call: "Ligação agendada na sua fila",
  followup: "Follow-up pendente atribuído a você",
  meeting: "Reunião na sua agenda",
  task: "Tarefa atribuída a você",
  approval: "Aguardando sua aprovação",
  project: "Projeto sob sua responsabilidade com prazo vencido ou próximo",
  client: "Cliente aguardando retorno seu",
  lead: "Lead sob sua responsabilidade precisa de atenção",
};

/** "Próximas ações" is always derived 1:1 from "Minha fila" — every action
 * suggested here points back at a real queue item (see
 * services/operations/operationsQueueService.ts), sorted by priority so the
 * most urgent thing you personally own is always first. */
export function buildNextActions(queue: OperationsQueueItem[]): OperationsNextAction[] {
  const priorityOrder: Record<OperationsPriority, number> = { alta: 0, media: 1, baixa: 2 };

  return queue
    .map((item) => ({
      id: `action-${item.id}`,
      title: ACTION_VERB[item.type](item),
      reason: item.overdue ? `${REASON_BY_TYPE[item.type]} — vencido` : REASON_BY_TYPE[item.type],
      priority: computeActionPriority(item.dueAt, item.overdue),
      href: item.href,
    }))
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}
