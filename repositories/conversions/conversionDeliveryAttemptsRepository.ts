import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ConversionDeliveryAttempt } from "@/types/conversions";

interface ConversionDeliveryAttemptRow {
  id: string;
  conversion_delivery_id: string;
  status: "sucesso" | "erro";
  message: string | null;
  duration_ms: number | null;
  request_payload: Record<string, unknown> | null;
  response_body: Record<string, unknown> | null;
  http_status: number | null;
  created_at: string;
}

const ATTEMPT_SELECT =
  "id, conversion_delivery_id, status, message, duration_ms, request_payload, response_body, http_status, created_at";

function mapAttempt(row: ConversionDeliveryAttemptRow): ConversionDeliveryAttempt {
  return {
    id: row.id,
    conversionDeliveryId: row.conversion_delivery_id,
    status: row.status,
    message: row.message,
    durationMs: row.duration_ms,
    requestPayload: row.request_payload,
    responseBody: row.response_body,
    httpStatus: row.http_status,
    createdAt: row.created_at,
  };
}

export async function listAttemptsForDeliveries(
  supabase: SupabaseClient,
  deliveryIds: string[],
): Promise<Record<string, ConversionDeliveryAttempt[]>> {
  if (deliveryIds.length === 0) return {};

  const { data, error } = await supabase
    .from("conversion_delivery_attempts")
    .select(ATTEMPT_SELECT)
    .in("conversion_delivery_id", deliveryIds)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Falha ao carregar tentativas de envio: ${error.message}`);

  const grouped: Record<string, ConversionDeliveryAttempt[]> = {};
  for (const row of (data ?? []) as ConversionDeliveryAttemptRow[]) {
    const attempt = mapAttempt(row);
    if (!grouped[attempt.conversionDeliveryId]) grouped[attempt.conversionDeliveryId] = [];
    grouped[attempt.conversionDeliveryId].push(attempt);
  }
  return grouped;
}

export interface AttemptsPage {
  attempts: (ConversionDeliveryAttempt & {
    conversionEventId: string;
    conversionType: string;
    leadId: string | null;
    leadName: string | null;
    destination: string;
  })[];
  total: number;
}

export interface ListMetaAttemptsOptions {
  status?: "sucesso" | "erro";
  leadId?: string;
  conversionType?: string;
  search?: string;
  createdFrom?: string;
  createdTo?: string;
  limit?: number;
  offset?: number;
}

/** Powers the dedicated Meta Logs screen — joins each attempt back to its
 * delivery/event/lead so the "Lead" and "Evento" filters have something to
 * filter on, without duplicating that context onto every attempt row. */
export async function listMetaAttempts(
  supabase: SupabaseClient,
  options: ListMetaAttemptsOptions = {},
): Promise<AttemptsPage> {
  let query = supabase
    .from("conversion_delivery_attempts")
    .select(
      `${ATTEMPT_SELECT}, delivery:conversion_deliveries!conversion_delivery_attempts_conversion_delivery_id_fkey (destination, conversion_event_id, event:conversion_events!conversion_deliveries_conversion_event_id_fkey (conversion_type, crm_lead_id, lead:crm_leads!conversion_events_crm_lead_id_fkey (name)))`,
      { count: "exact" },
    )
    .eq("delivery.destination", "meta_ads");

  if (options.status) query = query.eq("status", options.status);
  if (options.createdFrom) query = query.gte("created_at", options.createdFrom);
  if (options.createdTo) query = query.lte("created_at", options.createdTo);

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(options.offset ?? 0, (options.offset ?? 0) + (options.limit ?? 50) - 1);

  if (error) throw new Error(`Falha ao carregar logs da Meta: ${error.message}`);

  type Row = ConversionDeliveryAttemptRow & {
    delivery: {
      destination: string;
      conversion_event_id: string;
      event: {
        conversion_type: string;
        crm_lead_id: string | null;
        lead: { name: string } | null;
      } | null;
    } | null;
  };

  let attempts = ((data ?? []) as unknown as Row[])
    .filter((row) => row.delivery !== null)
    .map((row) => ({
      ...mapAttempt(row),
      conversionEventId: row.delivery?.conversion_event_id ?? "",
      conversionType: row.delivery?.event?.conversion_type ?? "",
      leadId: row.delivery?.event?.crm_lead_id ?? null,
      leadName: row.delivery?.event?.lead?.name ?? null,
      destination: row.delivery?.destination ?? "meta_ads",
    }));

  if (options.search) {
    const term = options.search.toLowerCase();
    attempts = attempts.filter((a) => a.leadName?.toLowerCase().includes(term));
  }
  if (options.leadId) attempts = attempts.filter((a) => a.leadId === options.leadId);
  if (options.conversionType) {
    attempts = attempts.filter((a) => a.conversionType === options.conversionType);
  }

  return { attempts, total: count ?? attempts.length };
}

export interface CreateAttemptPayload {
  conversionDeliveryId: string;
  status: "sucesso" | "erro";
  message?: string | null;
  durationMs?: number | null;
  requestPayload?: Record<string, unknown> | null;
  responseBody?: Record<string, unknown> | null;
  httpStatus?: number | null;
}

/** The write side the Meta dispatcher (services/conversionsHub/
 * dispatchMetaDelivery.ts) calls after every real attempt to send an event —
 * success or failure. Append-only: there is no update/delete function here,
 * matching the immutable-history RLS policy on this table. */
export async function createAttempt(
  supabase: SupabaseClient,
  payload: CreateAttemptPayload,
): Promise<void> {
  const { error } = await supabase.from("conversion_delivery_attempts").insert({
    conversion_delivery_id: payload.conversionDeliveryId,
    status: payload.status,
    message: payload.message ?? null,
    duration_ms: payload.durationMs ?? null,
    request_payload: payload.requestPayload ?? null,
    response_body: payload.responseBody ?? null,
    http_status: payload.httpStatus ?? null,
  });

  if (error) throw new Error(`Falha ao registrar tentativa de envio: ${error.message}`);
}
