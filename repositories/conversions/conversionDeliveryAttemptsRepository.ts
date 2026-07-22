import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ConversionDeliveryAttempt } from "@/types/conversions";

interface ConversionDeliveryAttemptRow {
  id: string;
  conversion_delivery_id: string;
  status: "sucesso" | "erro";
  message: string | null;
  duration_ms: number | null;
  created_at: string;
}

function mapAttempt(row: ConversionDeliveryAttemptRow): ConversionDeliveryAttempt {
  return {
    id: row.id,
    conversionDeliveryId: row.conversion_delivery_id,
    status: row.status,
    message: row.message,
    durationMs: row.duration_ms,
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
    .select("id, conversion_delivery_id, status, message, duration_ms, created_at")
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

export interface CreateAttemptPayload {
  conversionDeliveryId: string;
  status: "sucesso" | "erro";
  message?: string | null;
  durationMs?: number | null;
}

/** Not called anywhere yet — this is the write side a future dispatcher will
 * use every time it actually tries to send a delivery to a real platform.
 * Kept here now so that adding the real dispatcher later never requires
 * touching the schema or this repository, only calling this function. */
export async function createAttempt(
  supabase: SupabaseClient,
  payload: CreateAttemptPayload,
): Promise<void> {
  const { error } = await supabase.from("conversion_delivery_attempts").insert({
    conversion_delivery_id: payload.conversionDeliveryId,
    status: payload.status,
    message: payload.message ?? null,
    duration_ms: payload.durationMs ?? null,
  });

  if (error) throw new Error(`Falha ao registrar tentativa de envio: ${error.message}`);
}
