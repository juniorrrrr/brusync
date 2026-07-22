/** Catalog of every domain event the Event Bus (services/eventBus) knows how
 * to carry. This is infrastructure only — Fase 6 defines the shapes and the
 * publish path (`public.integration_events`), but nothing consumes them yet.
 * A future dispatcher fans these out to real destinations (Meta Conversions
 * API, GA4 Measurement Protocol, Webhooks, Slack, N8N, ...) by reading
 * pending rows — the CRM that publishes them never needs to change. */
export type EventType =
  | "LeadCreated"
  | "LeadUpdated"
  | "LeadQualified"
  | "LeadLost"
  | "LeadWon"
  | "DownloadMaterial"
  | "TaskCreated"
  | "TaskCompleted"
  | "ClientCreated"
  | "ClientUpdated"
  | "CampaignCreated"
  | "CampaignUpdated"
  | "CampaignPaused"
  | "RevenueRegistered";

export interface EventPayloadMap {
  LeadCreated: {
    leadId: string;
    name: string;
    company: string | null;
    origin: string | null;
    stageId: string;
    potentialValue: number | null;
  };
  LeadUpdated: {
    leadId: string;
    changedFields: string[];
  };
  LeadQualified: {
    leadId: string;
    stageId: string;
    stageLabel: string;
  };
  LeadLost: {
    leadId: string;
    reason: string;
  };
  LeadWon: {
    leadId: string;
    revenue: number | null;
  };
  DownloadMaterial: {
    email: string;
    materialSlug: string;
    materialTitle: string;
  };
  TaskCreated: {
    taskId: string;
    crmLeadId: string;
    title: string;
  };
  TaskCompleted: {
    taskId: string;
    crmLeadId: string;
    title: string;
  };
  ClientCreated: {
    clientId: string;
    company: string;
  };
  ClientUpdated: {
    clientId: string;
    changedFields: string[];
  };
  CampaignCreated: {
    utmSource: string;
    utmCampaign: string;
  };
  CampaignUpdated: {
    utmSource: string;
    utmCampaign: string;
    amount: number;
  };
  CampaignPaused: {
    utmSource: string;
    utmCampaign: string;
  };
  RevenueRegistered: {
    leadId: string;
    amount: number;
  };
}

/** entity_type stored alongside each event row, one per event family — lets
 * a future dispatcher or the Logs screen filter by "what kind of thing" an
 * event is about without parsing `event_type` strings. */
export const EVENT_ENTITY_TYPE: Record<EventType, string> = {
  LeadCreated: "lead",
  LeadUpdated: "lead",
  LeadQualified: "lead",
  LeadLost: "lead",
  LeadWon: "lead",
  DownloadMaterial: "material_lead",
  TaskCreated: "task",
  TaskCompleted: "task",
  ClientCreated: "client",
  ClientUpdated: "client",
  CampaignCreated: "campaign",
  CampaignUpdated: "campaign",
  CampaignPaused: "campaign",
  RevenueRegistered: "lead",
};
