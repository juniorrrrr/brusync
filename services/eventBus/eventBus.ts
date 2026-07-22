import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { EVENT_ENTITY_TYPE, type EventPayloadMap, type EventType } from "@/domain/events/types";

export interface PublishEventOptions {
  entityId?: string;
  actorId?: string | null;
}

/** The Event Bus: the CRM's only door to "the outside world". Publishing an
 * event means inserting one row into the `integration_events` outbox — the
 * CRM never knows (and must never know) who reads it or what they do with
 * it. Nothing consumes this table yet; a future dispatcher will poll rows
 * with status "pending" and fan them out to real destinations (Meta
 * Conversions API, GA4 Measurement Protocol, Webhooks, Slack, N8N, ...),
 * recording each attempt in `integration_logs`.
 *
 * Deliberately swallows every failure: a broken/blocked event bus (e.g. the
 * write-blocking Proxy that guards Demo Mode, a transient DB hiccup) must
 * never break the business action that triggered it. Callers fire-and-forget
 * this and never `await` it for correctness — only for "best effort, before
 * we move on". */
export async function publishEvent<T extends EventType>(
  supabase: SupabaseClient,
  eventType: T,
  payload: EventPayloadMap[T],
  options: PublishEventOptions = {},
): Promise<void> {
  try {
    const { error } = await supabase.from("integration_events").insert({
      event_type: eventType,
      entity_type: EVENT_ENTITY_TYPE[eventType],
      entity_id: options.entityId ?? null,
      payload,
      actor_id: options.actorId ?? null,
    });
    if (error) {
      console.error(`eventBus: falha ao publicar ${eventType}`, error.message);
    }
  } catch (err) {
    console.error(`eventBus: falha inesperada ao publicar ${eventType}`, err);
  }
}
