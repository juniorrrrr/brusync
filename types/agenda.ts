export type AgendaEventType =
  | "ligacao"
  | "reuniao"
  | "follow_up"
  | "proposta"
  | "implantacao"
  | "outro";

export type AgendaEventStatus = "agendado" | "concluido" | "cancelado";

export type ReminderStatus = "pendente" | "concluido" | "dispensado";

export type AgendaRangeFilter = "hoje" | "amanha" | "7dias" | "atrasados" | "concluidos";

export interface AgendaEvent {
  id: string;
  crmLeadId: string | null;
  leadName: string | null;
  stageKey: string | null;
  title: string;
  description: string | null;
  eventType: AgendaEventType;
  scheduledAt: string;
  durationMinutes: number | null;
  status: AgendaEventStatus;
  completedAt: string | null;
  ownerId: string | null;
  ownerName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AgendaReminder {
  id: string;
  crmLeadId: string | null;
  leadName: string | null;
  agendaEventId: string | null;
  message: string;
  remindAt: string;
  status: ReminderStatus;
  ownerId: string | null;
  createdAt: string;
}

export interface AgendaHealth {
  activitiesToday: number;
  overdue: number;
  meetingsToday: number;
  pendingFollowUps: number;
  completionRate: number | null;
  averageTimeToCompleteMs: number | null;
}
