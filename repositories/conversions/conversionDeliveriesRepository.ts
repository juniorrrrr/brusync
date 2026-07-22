import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ConversionDelivery,
  ConversionDeliveryStatus,
  ConversionDestination,
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

const DELIVERY_SELECT =
  "id, conversion_event_id, destination, status, attempts, last_error, sent_at, created_at, updated_at";

/** Fans a freshly-created conversion event out into one "queued" delivery
 * per destination platform — this is the "fila de envio" the Fase 8 spec
 * asks for. Every delivery starts as "pendente"; real dispatchers (Fase 9's
 * Meta one, and any future one) pick up their destination from here. Returns
 * the created rows' ids so the caller can hand the meta_ads one straight to
 * the dispatcher without a second round-trip. */
export async function createDeliveriesForEvent(
  supabase: SupabaseClient,
  conversionEventId: string,
  destinations: ConversionDestination[],
): Promise<{ id: string; destination: ConversionDestination }[]> {
  const { data, error } = await supabase
    .from("conversion_deliveries")
    .insert(
      destinations.map((destination) => ({
        conversion_event_id: conversionEventId,
        destination,
        status: "pendente",
      })),
    )
    .select("id, destination");

  if (error) throw new Error(`Falha ao enfileirar entregas de conversão: ${error.message}`);
  return (data ?? []) as { id: string; destination: ConversionDestination }[];
}

export interface DeliveryStatusCounts {
  pendente: number;
  enviado: number;
  falhou: number;
}

export async function getDeliveryStatusCounts(
  supabase: SupabaseClient,
  destination?: ConversionDestination,
): Promise<DeliveryStatusCounts> {
  function base() {
    let query = supabase.from("conversion_deliveries").select("*", { count: "exact", head: true });
    if (destination) query = query.eq("destination", destination);
    return query;
  }

  const [{ count: pendente }, { count: enviado }, { count: falhou }] = await Promise.all([
    base().eq("status", "pendente"),
    base().eq("status", "enviado"),
    base().eq("status", "falhou"),
  ]);

  return { pendente: pendente ?? 0, enviado: enviado ?? 0, falhou: falhou ?? 0 };
}

export async function getDeliveryCountsByDestination(
  supabase: SupabaseClient,
): Promise<{ destination: ConversionDestination; count: number }[]> {
  const { data, error } = await supabase.from("conversion_deliveries").select("destination");
  if (error) throw new Error(`Falha ao agrupar entregas por destino: ${error.message}`);

  const counts = new Map<ConversionDestination, number>();
  for (const row of (data ?? []) as { destination: ConversionDestination }[]) {
    counts.set(row.destination, (counts.get(row.destination) ?? 0) + 1);
  }
  return [...counts.entries()].map(([destination, count]) => ({ destination, count }));
}

export async function getDeliveryById(
  supabase: SupabaseClient,
  id: string,
): Promise<ConversionDelivery | null> {
  const { data, error } = await supabase
    .from("conversion_deliveries")
    .select(DELIVERY_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Falha ao carregar entrega de conversão: ${error.message}`);
  return data ? mapDelivery(data as unknown as ConversionDeliveryRow) : null;
}

export interface UpdateDeliveryStatusPayload {
  status: ConversionDeliveryStatus;
  attempts?: number;
  lastError?: string | null;
  sentAt?: string | null;
}

export async function updateDeliveryStatus(
  supabase: SupabaseClient,
  id: string,
  patch: UpdateDeliveryStatusPayload,
): Promise<void> {
  const { error } = await supabase
    .from("conversion_deliveries")
    .update({
      status: patch.status,
      ...(patch.attempts !== undefined ? { attempts: patch.attempts } : {}),
      ...(patch.lastError !== undefined ? { last_error: patch.lastError } : {}),
      ...(patch.sentAt !== undefined ? { sent_at: patch.sentAt } : {}),
    })
    .eq("id", id);

  if (error) throw new Error(`Falha ao atualizar entrega de conversão: ${error.message}`);
}

/** Powers the retry cron (app/api/cron/meta-retry) — deliveries stuck at
 * exactly `attempts` (failed that many times, or crashed mid-send while
 * "enviando") whose last update is old enough per the backoff schedule. */
export async function listDeliveriesForRetry(
  supabase: SupabaseClient,
  destination: ConversionDestination,
  attempts: number,
  staleBefore: string,
  limit = 25,
): Promise<ConversionDelivery[]> {
  const { data, error } = await supabase
    .from("conversion_deliveries")
    .select(DELIVERY_SELECT)
    .eq("destination", destination)
    .eq("attempts", attempts)
    .in("status", ["falhou", "enviando"])
    .lt("updated_at", staleBefore)
    .order("updated_at", { ascending: true })
    .limit(limit);

  if (error) throw new Error(`Falha ao listar entregas para retry: ${error.message}`);
  return ((data ?? []) as unknown as ConversionDeliveryRow[]).map(mapDelivery);
}
