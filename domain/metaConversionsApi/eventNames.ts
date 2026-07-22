import type { ConversionType } from "@/types/conversions";

/** Meta Conversions API custom event names — exactly the 7 named in the
 * Fase 9 spec, one per ConversionType (Fase 8). These are custom event
 * names (not one of Meta's standard events like "Lead" the pixel already
 * reserves), which is fine — Meta accepts any string as event_name; using
 * these specific names keeps them recognizable in Events Manager. */
export const CONVERSION_TYPE_TO_META_EVENT: Record<ConversionType, string> = {
  lead: "Lead",
  qualified_lead: "QualifiedLead",
  meeting_scheduled: "Schedule",
  proposal_sent: "Proposal",
  purchase: "Purchase",
  lost_lead: "LeadLost",
  client_activated: "ClientActivated",
};

/** Key used in `integrations.config.metaEventsEnabled` (Fase 6's jsonb
 * column) — lets each conversion type be turned on/off independently, per
 * the Fase 9 spec ("cada empresa poderá escolher quais eventos deseja
 * enviar"). Defaults to enabled when the key is absent (a freshly-connected
 * Meta integration sends everything until the user opts specific events
 * out). */
export const CONVERSION_TYPES_FOR_META: ConversionType[] = [
  "lead",
  "qualified_lead",
  "meeting_scheduled",
  "proposal_sent",
  "purchase",
  "lost_lead",
  "client_activated",
];
