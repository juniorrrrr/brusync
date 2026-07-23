import type { EventType } from "@/domain/events/types";
import type { AutomationTriggerType } from "@/types/automation";

/** Bridges the Event Bus (Fase 6) to the automation engine's own trigger
 * vocabulary — only the event types with a matching example in the Fase 10
 * spec are wired up; everything else simply has no automation reacting to
 * it yet. "lead_stalled" has no entry here on purpose: it's time-based, not
 * event-based, and is evaluated separately by a scheduled check instead. */
export const EVENT_TYPE_TO_AUTOMATION_TRIGGER: Partial<Record<EventType, AutomationTriggerType>> = {
  LeadCreated: "lead_created",
  LeadQualified: "lead_qualified",
  LeadLost: "lead_lost",
  ClientCreated: "client_created",
};
