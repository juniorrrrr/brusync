import type { EventType } from "@/domain/events/types";
import type {
  ConversionDeliveryStatus,
  ConversionDestination,
  ConversionType,
} from "@/types/conversions";
import type { BadgeTone } from "@/types/crm";

export const CONVERSION_TYPE_LABEL: Record<ConversionType, string> = {
  lead: "Lead",
  qualified_lead: "Qualified Lead",
  meeting_scheduled: "Meeting Scheduled",
  proposal_sent: "Proposal Sent",
  purchase: "Purchase",
  lost_lead: "Lost Lead",
  client_activated: "Client Activated",
};

export const CONVERSION_TYPE_BADGE: Record<ConversionType, BadgeTone> = {
  lead: "info",
  qualified_lead: "warn",
  meeting_scheduled: "info",
  proposal_sent: "warn",
  purchase: "ok",
  lost_lead: "danger",
  client_activated: "ok",
};

export const CONVERSION_DESTINATIONS: ConversionDestination[] = [
  "meta_ads",
  "google_ads",
  "ga4",
  "tiktok_ads",
  "linkedin_ads",
  "webhook",
];

export const CONVERSION_DESTINATION_LABEL: Record<ConversionDestination, string> = {
  meta_ads: "Meta Ads",
  google_ads: "Google Ads",
  ga4: "GA4",
  tiktok_ads: "TikTok",
  linkedin_ads: "LinkedIn",
  webhook: "Webhook",
};

export const CONVERSION_DELIVERY_STATUS_LABEL: Record<ConversionDeliveryStatus, string> = {
  pendente: "Pendente",
  enviando: "Enviando",
  enviado: "Enviado",
  falhou: "Falhou",
  reprocessando: "Reprocessando",
};

export const CONVERSION_DELIVERY_STATUS_BADGE: Record<ConversionDeliveryStatus, BadgeTone> = {
  pendente: "info",
  enviando: "warn",
  enviado: "ok",
  falhou: "danger",
  reprocessando: "warn",
};

/** Which of the Event Bus's types (domain/events/types.ts, Fase 6) the
 * Conversions Hub knows how to turn into a conversion — exactly the 7 named
 * in the Fase 8 spec. Every other event type published by the CRM (lead
 * edits, task/client CRUD, campaign spend, material downloads) has no
 * conversion counterpart and is left untouched. */
export const EVENT_TYPE_TO_CONVERSION_TYPE: Partial<Record<EventType, ConversionType>> = {
  LeadCreated: "lead",
  LeadQualified: "qualified_lead",
  MeetingScheduled: "meeting_scheduled",
  ProposalSent: "proposal_sent",
  LeadWon: "purchase",
  LeadLost: "lost_lead",
  ClientActivated: "client_activated",
};

/** Which part of the Brusync CRM actually publishes each of the mapped
 * event types — shown as "Origem" on the Conversions dashboard. Distinct
 * from utm_source/marketing origin, which lives on the event itself. */
export const EVENT_TYPE_ORIGIN: Partial<Record<EventType, string>> = {
  LeadCreated: "Cadastro de Lead",
  LeadQualified: "Pipeline",
  LeadWon: "Pipeline",
  LeadLost: "Pipeline",
  ProposalSent: "Jornada Comercial",
  MeetingScheduled: "Jornada Comercial",
  ClientActivated: "Jornada Comercial",
};
