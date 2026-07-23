import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { EVENT_ENTITY_TYPE, type EventPayloadMap, type EventType } from "@/domain/events/types";
import { runAutomationsForEvent } from "@/services/automation/automationEngine";
import { prepareConversionEvent } from "@/services/conversionsHub/prepareConversion";

export interface PublishEventOptions {
  entityId?: string;
  actorId?: string | null;
}

/** The Event Bus: the CRM's only door to "the outside world". Publishing an
 * event means inserting one row into the `integration_events` outbox — the
 * CRM never knows (and must never know) who reads it or what they do with
 * it. Since Fase 8, the Conversions Hub (services/conversionsHub) also reads
 * each event right here to prepare a normalized conversion + queued
 * deliveries for the 7 conversion-relevant event types (Lead, Qualified
 * Lead, Meeting Scheduled, Proposal Sent, Purchase, Lost Lead, Client
 * Activated) — still never calling any external API. Since Fase 10, the
 * automation engine (services/automation) also reads each event here to
 * evaluate any active workflow bound to that trigger and, if its condition
 * passes, run its action — still entirely internal to the CRM. Every other
 * consumer (a future dispatcher for Meta Conversions API, GA4 Measurement
 * Protocol, Webhooks, Slack, N8N, ...) will poll `integration_events`/
 * `conversion_deliveries` independently; the CRM that publishes here never
 * needs to change for any of that.
 *
 * Deliberately swallows every failure: a broken/blocked event bus (e.g. the
 * write-blocking Proxy that guards Demo Mode, a transient DB hiccup) must
 * never break the business action that triggered it. */
export async function publishEvent<T extends EventType>(
  supabase: SupabaseClient,
  eventType: T,
  payload: EventPayloadMap[T],
  options: PublishEventOptions = {},
): Promise<void> {
  try {
    const { data, error } = await supabase
      .from("integration_events")
      .insert({
        event_type: eventType,
        entity_type: EVENT_ENTITY_TYPE[eventType],
        entity_id: options.entityId ?? null,
        payload,
        actor_id: options.actorId ?? null,
      })
      .select("id")
      .single();

    if (error) {
      console.error(`eventBus: falha ao publicar ${eventType}`, error.message);
      return;
    }

    await prepareConversionEvent(supabase, eventType, payload as Record<string, unknown>, {
      integrationEventId: (data as { id: string }).id,
      actorId: options.actorId ?? null,
    });

    await runAutomationsForEvent(supabase, eventType, payload as Record<string, unknown>);
  } catch (err) {
    console.error(`eventBus: falha inesperada ao publicar ${eventType}`, err);
  }
}
