import "server-only";

import { buildNextActions } from "@/domain/operations/priority";
import type { OperationsData } from "@/services/operations/operationsDataService";
import type { AgendaEventType } from "@/types/agenda";
import type {
  OperationsNextAction,
  OperationsQueueItem,
  OperationsQueueItemType,
} from "@/types/operations";

const AGENDA_TYPE_TO_QUEUE_TYPE: Record<AgendaEventType, OperationsQueueItemType> = {
  ligacao: "call",
  reuniao: "meeting",
  follow_up: "followup",
  proposta: "task",
  implantacao: "task",
  outro: "task",
};

/** "O que depende de mim" — every item here is filtered to the logged-in
 * user from data already fetched for the rest of the page (tasks, agenda
 * events, leads, projects, conversations all carry an owner/assignee id),
 * never a second query per source. */
export function computeOperationsQueue(
  data: OperationsData,
  profileId: string,
): OperationsQueueItem[] {
  const now = data.now;
  const items: OperationsQueueItem[] = [];

  for (const task of data.crm.upcomingTasks) {
    if (task.assigneeId !== profileId) continue;
    items.push({
      id: `task-${task.id}`,
      type: "task",
      title: task.title,
      subtitle: task.leadName,
      dueAt: task.dueAt,
      overdue: !!task.dueAt && new Date(task.dueAt) < now,
      href: "/leads",
    });
  }

  for (const event of data.agendaToday) {
    if (event.ownerId !== profileId || event.status !== "agendado") continue;
    items.push({
      id: `agenda-${event.id}`,
      type: AGENDA_TYPE_TO_QUEUE_TYPE[event.eventType],
      title: event.title,
      subtitle: event.leadName,
      dueAt: event.scheduledAt,
      overdue: new Date(event.scheduledAt) < now,
      href: "/agenda",
    });
  }

  for (const lead of data.crm.awaitingContact) {
    if (lead.owner?.id !== profileId) continue;
    items.push({
      id: `lead-${lead.id}`,
      type: "lead",
      title: lead.name,
      subtitle: lead.company,
      dueAt: null,
      overdue: false,
      href: "/leads",
    });
  }

  for (const project of data.projectsDueSoon) {
    if (project.ownerId !== profileId) continue;
    items.push({
      id: `project-${project.id}`,
      type: "project",
      title: project.name,
      subtitle: project.clientCompany,
      dueAt: project.dueAt,
      overdue: !!project.dueAt && new Date(project.dueAt) < now,
      href: "/projetos",
    });
  }

  for (const conversation of data.communication) {
    if (conversation.ownerId !== profileId) continue;
    if (conversation.lastMessageDirection !== "inbound" || conversation.unreadCount === 0) continue;
    items.push({
      id: `client-${conversation.id}`,
      type: "client",
      title:
        conversation.crmLeadName ??
        conversation.clientCompany ??
        conversation.contactName ??
        "Contato",
      subtitle: conversation.lastMessagePreview,
      dueAt: conversation.lastMessageAt,
      overdue: false,
      href: "/comunicacao",
    });
  }

  return items.sort((a, b) => {
    const aOverdue = a.overdue ? 0 : 1;
    const bOverdue = b.overdue ? 0 : 1;
    if (aOverdue !== bOverdue) return aOverdue - bOverdue;
    if (!a.dueAt && !b.dueAt) return 0;
    if (!a.dueAt) return 1;
    if (!b.dueAt) return -1;
    return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
  });
}

export function computeOperationsNextActions(queue: OperationsQueueItem[]): OperationsNextAction[] {
  return buildNextActions(queue);
}
