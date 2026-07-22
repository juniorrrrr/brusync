"use server";

import { getConversionEventsForLead } from "@/application/conversions/conversionsQueries";
import { requireCrmProfile } from "@/application/crm/authGuard";
import { getDemoMetaEventsForLead } from "@/lib/demo/mockMetaEvents";
import { listAttemptsForDeliveries } from "@/repositories/conversions/conversionDeliveryAttemptsRepository";
import { getIntegrationByProvider } from "@/repositories/integrations/integrationsRepository";
import { dispatchMetaDelivery } from "@/services/conversionsHub/dispatchMetaDelivery";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type { LeadMetaEvent } from "@/types/metaConversionsApi";

export async function fetchMetaEventsForLead(crmLeadId: string): Promise<LeadMetaEvent[]> {
  await requireCrmProfile();

  if (await isDemoModeActive()) return getDemoMetaEventsForLead(crmLeadId);

  const supabase = await getSupabaseAuthClient();
  const [events, integration] = await Promise.all([
    getConversionEventsForLead(crmLeadId),
    getIntegrationByProvider(supabase, "meta_ads"),
  ]);

  const pixelId = (integration?.config as { pixelId?: string } | undefined)?.pixelId ?? null;

  const metaDeliveryIds = events.flatMap((event) =>
    event.deliveries.filter((d) => d.destination === "meta_ads").map((d) => d.id),
  );
  const attemptsByDelivery = await listAttemptsForDeliveries(supabase, metaDeliveryIds);

  const result: LeadMetaEvent[] = [];
  for (const event of events) {
    const delivery = event.deliveries.find((d) => d.destination === "meta_ads");
    if (!delivery) continue;
    const attempts = attemptsByDelivery[delivery.id] ?? [];
    result.push({
      deliveryId: delivery.id,
      conversionType: event.conversionType,
      occurredAt: event.occurredAt,
      status: delivery.status,
      attempts: delivery.attempts,
      lastError: delivery.lastError,
      sentAt: delivery.sentAt,
      pixelId,
      latestAttempt: attempts[0] ?? null,
    });
  }

  return result.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
}

const DEMO_WRITE_BLOCKED_MESSAGE =
  "Ação indisponível em Modo Demonstração — nenhuma escrita é enviada ao banco.";

/** "Reenviar" — the Fase 9 spec's manual retry from the Lead Workspace's
 * Meta tab. Goes through the exact same dispatcher as every automatic send;
 * there is no separate "resend" code path to the Meta API. */
export async function resendMetaDeliveryAction(
  deliveryId: string,
): Promise<{ ok: boolean; error?: string }> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return { ok: false, error: DEMO_WRITE_BLOCKED_MESSAGE };

  const supabase = await getSupabaseAuthClient();
  await dispatchMetaDelivery(supabase, deliveryId, { force: true });
  return { ok: true };
}
