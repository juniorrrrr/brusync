import type { AgendaEventStatus, AgendaRangeFilter } from "@/types/agenda";

export interface AgendaRangeQuery {
  scheduledFrom?: string;
  scheduledTo?: string;
  status?: AgendaEventStatus;
}

/** Translates a range filter button into concrete query bounds — the single
 * place this logic lives, shared by the real repository query and the demo
 * dataset's own filtering, so "Hoje"/"Amanhã"/"Atrasados" always mean
 * exactly the same thing in both modes. */
export function resolveRangeQuery(range: AgendaRangeFilter, now = new Date()): AgendaRangeQuery {
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const startOfTomorrow = new Date(startOfDay);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

  const startOfDayAfterTomorrow = new Date(startOfTomorrow);
  startOfDayAfterTomorrow.setDate(startOfDayAfterTomorrow.getDate() + 1);

  const in7Days = new Date(startOfDay);
  in7Days.setDate(in7Days.getDate() + 7);

  switch (range) {
    case "hoje":
      return {
        scheduledFrom: startOfDay.toISOString(),
        scheduledTo: startOfTomorrow.toISOString(),
      };
    case "amanha":
      return {
        scheduledFrom: startOfTomorrow.toISOString(),
        scheduledTo: startOfDayAfterTomorrow.toISOString(),
      };
    case "7dias":
      return {
        scheduledFrom: startOfDay.toISOString(),
        scheduledTo: in7Days.toISOString(),
        status: "agendado",
      };
    case "atrasados":
      return { scheduledTo: now.toISOString(), status: "agendado" };
    case "concluidos":
      return { status: "concluido" };
    default:
      return {};
  }
}
