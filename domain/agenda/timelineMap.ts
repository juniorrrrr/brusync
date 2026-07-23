import type { AgendaEventType } from "@/types/agenda";
import type { ActivityType } from "@/types/crm";

/** Which existing Timeline entry type (types/crm.ts's ActivityType — no new
 * value added, no schema change) best represents each agenda event type.
 * "Ligação" and "Reunião" already have exact matches; everything else maps
 * to the generic "system" entry, same choice Fase 10's automation engine
 * made for actions without a dedicated type. */
export const AGENDA_EVENT_TYPE_TO_ACTIVITY_TYPE: Record<AgendaEventType, ActivityType> = {
  ligacao: "call",
  reuniao: "meeting",
  follow_up: "system",
  proposta: "system",
  implantacao: "system",
  outro: "system",
};
