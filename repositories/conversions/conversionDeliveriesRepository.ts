import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ConversionDestination } from "@/types/conversions";

/** Fans a freshly-created conversion event out into one "queued" delivery
 * per destination platform — this is the "fila de envio" the Fase 8 spec
 * asks for. Every delivery starts as "pendente"; nothing in this phase ever
 * moves it past that, since no real dispatcher exists yet. */
export async function createDeliveriesForEvent(
  supabase: SupabaseClient,
  conversionEventId: string,
  destinations: ConversionDestination[],
): Promise<void> {
  const { error } = await supabase.from("conversion_deliveries").insert(
    destinations.map((destination) => ({
      conversion_event_id: conversionEventId,
      destination,
      status: "pendente",
    })),
  );

  if (error) throw new Error(`Falha ao enfileirar entregas de conversão: ${error.message}`);
}

export interface DeliveryStatusCounts {
  pendente: number;
  enviado: number;
  falhou: number;
}

export async function getDeliveryStatusCounts(
  supabase: SupabaseClient,
): Promise<DeliveryStatusCounts> {
  const [{ count: pendente }, { count: enviado }, { count: falhou }] = await Promise.all([
    supabase
      .from("conversion_deliveries")
      .select("*", { count: "exact", head: true })
      .eq("status", "pendente"),
    supabase
      .from("conversion_deliveries")
      .select("*", { count: "exact", head: true })
      .eq("status", "enviado"),
    supabase
      .from("conversion_deliveries")
      .select("*", { count: "exact", head: true })
      .eq("status", "falhou"),
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
