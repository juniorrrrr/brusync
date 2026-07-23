import { ownerName } from "@/lib/demo/mockJourney";
import { DEMO_LEADS, DEMO_OWNERS, type DemoLeadSeed } from "@/lib/demo/mockSeed";
import type { ListAgendaEventsOptions } from "@/repositories/agenda/agendaEventsRepository";
import type { ListRemindersOptions } from "@/repositories/agenda/remindersRepository";
import type {
  AgendaEvent,
  AgendaEventStatus,
  AgendaEventType,
  AgendaHealth,
  AgendaReminder,
} from "@/types/agenda";

const EVENT_TYPES: AgendaEventType[] = [
  "ligacao",
  "reuniao",
  "follow_up",
  "proposta",
  "implantacao",
  "outro",
];

const TITLE_BY_TYPE: Record<AgendaEventType, string> = {
  ligacao: "Ligação de alinhamento",
  reuniao: "Reunião de apresentação",
  follow_up: "Follow-up da proposta",
  proposta: "Enviar proposta comercial",
  implantacao: "Kickoff de implantação",
  outro: "Retorno combinado",
};

function hoursFromNow(hours: number): string {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

/** One deterministic offset (in hours from "now") plus outcome per lead
 * index — spreads events across overdue / today / tomorrow / this week /
 * already completed, so every range filter has something realistic to
 * show, the same seeded-by-index approach mockMetaEvents.ts and
 * mockAutomations.ts already use. */
function planFor(index: number): { offsetHours: number; status: AgendaEventStatus } {
  const bucket = index % 6;
  switch (bucket) {
    case 0:
      return { offsetHours: -30, status: "agendado" }; // atrasado
    case 1:
      return { offsetHours: 2, status: "agendado" }; // hoje, mais tarde
    case 2:
      return { offsetHours: -3, status: "concluido" }; // concluído hoje
    case 3:
      return { offsetHours: 26, status: "agendado" }; // amanhã
    case 4:
      return { offsetHours: 96, status: "agendado" }; // esta semana
    default:
      return { offsetHours: -50, status: "cancelado" }; // cancelado (passado)
  }
}

function buildEventForSeed(seed: DemoLeadSeed, index: number): AgendaEvent {
  const eventType = EVENT_TYPES[index % EVENT_TYPES.length];
  // The status/offset bucket is seeded from the lead id, not from the same
  // index driving eventType — using the same modulo for both would lock
  // each event type to exactly one outcome (e.g. every "follow_up" always
  // landing on "concluído", every "ligação" always overdue), which looks
  // like a bug rather than a realistic spread once you filter by type.
  const bucketSeed = seed.id.charCodeAt(seed.id.length - 1) + index;
  const plan = planFor(bucketSeed);
  const scheduledAt = hoursFromNow(plan.offsetHours);
  const id = `00000000-a012-4000-8000-${String(index + 1).padStart(6, "0")}${seed.id.slice(-6)}`;

  return {
    id,
    crmLeadId: seed.id,
    leadName: seed.name,
    stageKey: seed.stageKey,
    title: `${TITLE_BY_TYPE[eventType]} — ${seed.company}`,
    description: null,
    eventType,
    scheduledAt,
    durationMinutes: eventType === "reuniao" ? 45 : eventType === "ligacao" ? 15 : null,
    status: plan.status,
    completedAt: plan.status === "concluido" ? scheduledAt : null,
    ownerId: seed.ownerIndex !== null ? (DEMO_OWNERS[seed.ownerIndex]?.id ?? null) : null,
    ownerName: ownerName(seed),
    createdAt: scheduledAt,
    updatedAt: scheduledAt,
  };
}

function buildAllDemoEvents(): AgendaEvent[] {
  return DEMO_LEADS.map((seed, index) => buildEventForSeed(seed, index)).sort((a, b) =>
    a.scheduledAt.localeCompare(b.scheduledAt),
  );
}

export function getDemoAgendaEvents(options: ListAgendaEventsOptions = {}): {
  events: AgendaEvent[];
  total: number;
} {
  let events = buildAllDemoEvents();

  if (options.scheduledFrom)
    events = events.filter((e) => e.scheduledAt >= (options.scheduledFrom as string));
  if (options.scheduledTo)
    events = events.filter((e) => e.scheduledAt < (options.scheduledTo as string));
  if (options.status) events = events.filter((e) => e.status === options.status);
  if (options.ownerId) events = events.filter((e) => e.ownerId === options.ownerId);
  if (options.stageKey) events = events.filter((e) => e.stageKey === options.stageKey);
  if (options.crmLeadId) events = events.filter((e) => e.crmLeadId === options.crmLeadId);
  if (options.eventType) events = events.filter((e) => e.eventType === options.eventType);
  if (options.search) {
    const term = options.search.toLowerCase();
    events = events.filter(
      (e) => e.title.toLowerCase().includes(term) || e.leadName?.toLowerCase().includes(term),
    );
  }

  const total = events.length;
  const offset = options.offset ?? 0;
  const limit = options.limit ?? 100;
  return { events: events.slice(offset, offset + limit), total };
}

export function getDemoAgendaEventsForLead(crmLeadId: string): AgendaEvent[] {
  return buildAllDemoEvents()
    .filter((e) => e.crmLeadId === crmLeadId)
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
}

export function getDemoAgendaEventById(id: string): AgendaEvent | null {
  return buildAllDemoEvents().find((e) => e.id === id) ?? null;
}

export function getDemoAgendaHealth(): AgendaHealth {
  const events = buildAllDemoEvents();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startOfTomorrow = new Date(startOfDay);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
  const now = new Date().toISOString();

  const today = events.filter(
    (e) =>
      e.scheduledAt >= startOfDay.toISOString() && e.scheduledAt < startOfTomorrow.toISOString(),
  );
  const overdue = events.filter((e) => e.status === "agendado" && e.scheduledAt < now);
  const meetingsToday = today.filter((e) => e.eventType === "reuniao");
  const pendingFollowUps = events.filter(
    (e) => e.eventType === "follow_up" && e.status === "agendado",
  );
  const finished = events.filter((e) => e.status === "concluido" || e.status === "cancelado");
  const completed = events.filter((e) => e.status === "concluido" && e.completedAt);

  return {
    activitiesToday: today.length,
    overdue: overdue.length,
    meetingsToday: meetingsToday.length,
    pendingFollowUps: pendingFollowUps.length,
    completionRate: finished.length > 0 ? (completed.length / finished.length) * 100 : null,
    averageTimeToCompleteMs:
      completed.length > 0
        ? Math.round(
            completed.reduce(
              (sum, e) =>
                sum +
                (new Date(e.completedAt as string).getTime() - new Date(e.scheduledAt).getTime()),
              0,
            ) / completed.length,
          )
        : null,
  };
}

const DEMO_REMINDERS: AgendaReminder[] = DEMO_LEADS.slice(0, 4).map((seed, index) => ({
  id: `00000000-a013-4000-8000-${String(index + 1).padStart(6, "0")}${seed.id.slice(-6)}`,
  crmLeadId: seed.id,
  leadName: seed.name,
  agendaEventId: null,
  message: `Confirmar interesse de ${seed.name} antes da próxima etapa.`,
  remindAt: hoursFromNow(index % 2 === 0 ? 5 : -4),
  status: index % 3 === 0 ? "concluido" : "pendente",
  ownerId: seed.ownerIndex !== null ? (DEMO_OWNERS[seed.ownerIndex]?.id ?? null) : null,
  createdAt: hoursFromNow(-24),
}));

export function getDemoReminders(options: ListRemindersOptions = {}): AgendaReminder[] {
  let reminders = DEMO_REMINDERS;
  if (options.status) reminders = reminders.filter((r) => r.status === options.status);
  if (options.crmLeadId) reminders = reminders.filter((r) => r.crmLeadId === options.crmLeadId);
  return reminders.slice(0, options.limit ?? 50);
}
