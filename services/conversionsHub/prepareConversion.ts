import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  CONVERSION_DESTINATIONS,
  EVENT_TYPE_ORIGIN,
  EVENT_TYPE_TO_CONVERSION_TYPE,
} from "@/domain/conversions/types";
import type { EventType } from "@/domain/events/types";
import { buildCampaignKey } from "@/domain/marketing/campaignKey";
import { createDeliveriesForEvent } from "@/repositories/conversions/conversionDeliveriesRepository";
import { createConversionEvent } from "@/repositories/conversions/conversionEventsRepository";
import { getClientBySourceLeadId } from "@/repositories/crm/clientsRepository";
import { getLeadById } from "@/repositories/crm/leadsRepository";
import { getSourceLeadAttribution } from "@/repositories/crm/marketingRepository";

export interface PrepareConversionOptions {
  integrationEventId: string;
  actorId: string | null;
}

/** The Conversions Hub: turns a Motor de Conversões event (Fase 7, published
 * through services/eventBus) into a normalized "conversion event" plus one
 * queued delivery per destination platform — ready for a future dispatcher
 * to actually send, but never calling any external API itself.
 *
 * Called from publishEvent() right after the integration_events insert.
 * Deliberately never throws: a bug in conversion preparation must never
 * break the Event Bus publish, which must never break the business action
 * that triggered it (same defensive layering as Fase 6/7). */
export async function prepareConversionEvent(
  supabase: SupabaseClient,
  eventType: EventType,
  payload: Record<string, unknown>,
  options: PrepareConversionOptions,
): Promise<void> {
  const conversionType = EVENT_TYPE_TO_CONVERSION_TYPE[eventType];
  if (!conversionType) return;

  const leadId = typeof payload.leadId === "string" ? payload.leadId : null;
  if (!leadId) return;

  try {
    const lead = await getLeadById(supabase, leadId);
    if (!lead) return;

    const [attribution, client] = await Promise.all([
      lead.sourceLeadId ? getSourceLeadAttribution(supabase, lead.sourceLeadId) : null,
      getClientBySourceLeadId(supabase, leadId),
    ]);

    const revenue = typeof payload.revenue === "number" ? payload.revenue : null;
    const value = eventType === "LeadWon" ? (revenue ?? lead.potentialValue) : lead.potentialValue;

    const event = await createConversionEvent(supabase, {
      conversionType,
      origin: EVENT_TYPE_ORIGIN[eventType] ?? "CRM",
      crmLeadId: leadId,
      clientId: client?.id ?? null,
      utmSource: attribution?.utmSource ?? null,
      utmMedium: attribution?.utmMedium ?? null,
      utmCampaign: attribution?.utmCampaign ?? null,
      utmContent: attribution?.utmContent ?? null,
      utmTerm: attribution?.utmTerm ?? null,
      campaignKey: buildCampaignKey({
        utmSource: attribution?.utmSource ?? null,
        utmCampaign: attribution?.utmCampaign ?? null,
      }),
      gclid: attribution?.gclid ?? null,
      fbclid: attribution?.fbclid ?? null,
      msclkid: attribution?.msclkid ?? null,
      ttclid: attribution?.ttclid ?? null,
      actorId: options.actorId,
      value,
      integrationEventId: options.integrationEventId,
    });

    await createDeliveriesForEvent(supabase, event.id, CONVERSION_DESTINATIONS);
  } catch (err) {
    console.error(`conversionsHub: falha ao preparar conversão para ${eventType}`, err);
  }
}
