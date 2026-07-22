export type ConversionType =
  | "lead"
  | "qualified_lead"
  | "meeting_scheduled"
  | "proposal_sent"
  | "purchase"
  | "lost_lead"
  | "client_activated";

export type ConversionDestination =
  | "meta_ads"
  | "google_ads"
  | "ga4"
  | "tiktok_ads"
  | "linkedin_ads"
  | "webhook";

export type ConversionDeliveryStatus =
  | "pendente"
  | "enviando"
  | "enviado"
  | "falhou"
  | "reprocessando";

export interface ConversionDelivery {
  id: string;
  conversionEventId: string;
  destination: ConversionDestination;
  status: ConversionDeliveryStatus;
  attempts: number;
  lastError: string | null;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConversionDeliveryAttempt {
  id: string;
  conversionDeliveryId: string;
  status: "sucesso" | "erro";
  message: string | null;
  durationMs: number | null;
  requestPayload: Record<string, unknown> | null;
  responseBody: Record<string, unknown> | null;
  httpStatus: number | null;
  createdAt: string;
}

export interface ConversionEvent {
  id: string;
  conversionType: ConversionType;
  origin: string;
  crmLeadId: string | null;
  leadName: string | null;
  clientId: string | null;
  clientName: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
  campaignKey: string | null;
  gclid: string | null;
  fbclid: string | null;
  msclkid: string | null;
  ttclid: string | null;
  occurredAt: string;
  actorId: string | null;
  actorName: string | null;
  value: number | null;
  currency: string;
  ready: boolean;
  createdAt: string;
  deliveries: ConversionDelivery[];
}

export interface ConversionEventDetail extends ConversionEvent {
  attemptsByDelivery: Record<string, ConversionDeliveryAttempt[]>;
}

export interface ConversionsHealthSummary {
  totalEvents: number;
  pendingDeliveries: number;
  sentDeliveries: number;
  failedDeliveries: number;
  byOrigin: { origin: string; count: number }[];
  byDestination: { destination: ConversionDestination; count: number }[];
}
