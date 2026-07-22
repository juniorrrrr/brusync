import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ConversionDelivery,
  ConversionDeliveryStatus,
  ConversionDestination,
  ConversionEvent,
  ConversionType,
} from "@/types/conversions";

interface ConversionDeliveryRow {
  id: string;
  conversion_event_id: string;
  destination: ConversionDestination;
  status: ConversionDeliveryStatus;
  attempts: number;
  last_error: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

function mapDelivery(row: ConversionDeliveryRow): ConversionDelivery {
  return {
    id: row.id,
    conversionEventId: row.conversion_event_id,
    destination: row.destination,
    status: row.status,
    attempts: row.attempts,
    lastError: row.last_error,
    sentAt: row.sent_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

interface ConversionEventRow {
  id: string;
  conversion_type: ConversionType;
  origin: string;
  crm_lead_id: string | null;
  client_id: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  campaign_key: string | null;
  gclid: string | null;
  fbclid: string | null;
  msclkid: string | null;
  ttclid: string | null;
  occurred_at: string;
  actor_id: string | null;
  value: number | null;
  currency: string;
  ready: boolean;
  created_at: string;
  lead?: { name: string } | null;
  client?: { company: string } | null;
  actor?: { name: string | null; email: string | null } | null;
  deliveries?: ConversionDeliveryRow[] | null;
}

const CONVERSION_EVENT_SELECT = `
  id, conversion_type, origin, crm_lead_id, client_id,
  utm_source, utm_medium, utm_campaign, utm_content, utm_term, campaign_key,
  gclid, fbclid, msclkid, ttclid, occurred_at, actor_id, value, currency, ready, created_at,
  lead:crm_leads!conversion_events_crm_lead_id_fkey (name),
  client:clients!conversion_events_client_id_fkey (company),
  actor:profiles!conversion_events_actor_id_fkey (name, email),
  deliveries:conversion_deliveries!conversion_deliveries_conversion_event_id_fkey (
    id, conversion_event_id, destination, status, attempts, last_error, sent_at, created_at, updated_at
  )
`;

function mapConversionEvent(row: ConversionEventRow): ConversionEvent {
  return {
    id: row.id,
    conversionType: row.conversion_type,
    origin: row.origin,
    crmLeadId: row.crm_lead_id,
    leadName: row.lead?.name ?? null,
    clientId: row.client_id,
    clientName: row.client?.company ?? null,
    utmSource: row.utm_source,
    utmMedium: row.utm_medium,
    utmCampaign: row.utm_campaign,
    utmContent: row.utm_content,
    utmTerm: row.utm_term,
    campaignKey: row.campaign_key,
    gclid: row.gclid,
    fbclid: row.fbclid,
    msclkid: row.msclkid,
    ttclid: row.ttclid,
    occurredAt: row.occurred_at,
    actorId: row.actor_id,
    actorName: row.actor?.name ?? row.actor?.email ?? null,
    value: row.value,
    currency: row.currency,
    ready: row.ready,
    createdAt: row.created_at,
    deliveries: (row.deliveries ?? []).map(mapDelivery),
  };
}

export interface ListConversionEventsOptions {
  conversionType?: ConversionType;
  destination?: ConversionDestination;
  status?: ConversionDeliveryStatus;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ConversionEventsPage {
  events: ConversionEvent[];
  total: number;
}

export async function listConversionEvents(
  supabase: SupabaseClient,
  options: ListConversionEventsOptions = {},
): Promise<ConversionEventsPage> {
  let query = supabase
    .from("conversion_events")
    .select(CONVERSION_EVENT_SELECT, { count: "exact" });

  if (options.conversionType) query = query.eq("conversion_type", options.conversionType);
  if (options.search) {
    const term = options.search.replace(/[,()%]/g, " ").trim();
    if (term) query = query.ilike("lead.name", `%${term}%`);
  }

  const { data, error, count } = await query.order("occurred_at", { ascending: false });
  if (error) throw new Error(`Falha ao carregar eventos de conversão: ${error.message}`);

  let events = ((data ?? []) as unknown as ConversionEventRow[]).map(mapConversionEvent);

  // Destination/status filter needs the fanned-out deliveries, so it's
  // applied in JS after the join rather than as a second SQL predicate.
  if (options.destination) {
    events = events.filter((event) =>
      event.deliveries.some((delivery) => delivery.destination === options.destination),
    );
  }
  if (options.status) {
    events = events.filter((event) =>
      event.deliveries.some((delivery) => delivery.status === options.status),
    );
  }

  const total = count ?? events.length;
  const limit = options.limit ?? 50;
  const offset = options.offset ?? 0;
  return { events: events.slice(offset, offset + limit), total };
}

export async function getConversionEventById(
  supabase: SupabaseClient,
  id: string,
): Promise<ConversionEvent | null> {
  const { data, error } = await supabase
    .from("conversion_events")
    .select(CONVERSION_EVENT_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Falha ao carregar evento de conversão: ${error.message}`);
  return data ? mapConversionEvent(data as unknown as ConversionEventRow) : null;
}

export async function listConversionEventsForLead(
  supabase: SupabaseClient,
  crmLeadId: string,
): Promise<ConversionEvent[]> {
  const { data, error } = await supabase
    .from("conversion_events")
    .select(CONVERSION_EVENT_SELECT)
    .eq("crm_lead_id", crmLeadId)
    .order("occurred_at", { ascending: true });

  if (error) throw new Error(`Falha ao carregar conversões do lead: ${error.message}`);
  return ((data ?? []) as unknown as ConversionEventRow[]).map(mapConversionEvent);
}

export interface CreateConversionEventPayload {
  conversionType: ConversionType;
  origin: string;
  crmLeadId: string | null;
  clientId: string | null;
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
  actorId: string | null;
  value: number | null;
  integrationEventId: string | null;
}

export async function createConversionEvent(
  supabase: SupabaseClient,
  payload: CreateConversionEventPayload,
): Promise<{ id: string }> {
  const { data, error } = await supabase
    .from("conversion_events")
    .insert({
      conversion_type: payload.conversionType,
      origin: payload.origin,
      crm_lead_id: payload.crmLeadId,
      client_id: payload.clientId,
      utm_source: payload.utmSource,
      utm_medium: payload.utmMedium,
      utm_campaign: payload.utmCampaign,
      utm_content: payload.utmContent,
      utm_term: payload.utmTerm,
      campaign_key: payload.campaignKey,
      gclid: payload.gclid,
      fbclid: payload.fbclid,
      msclkid: payload.msclkid,
      ttclid: payload.ttclid,
      actor_id: payload.actorId,
      value: payload.value,
      integration_event_id: payload.integrationEventId,
    })
    .select("id")
    .single();

  if (error) throw new Error(`Falha ao criar evento de conversão: ${error.message}`);
  return data as { id: string };
}
