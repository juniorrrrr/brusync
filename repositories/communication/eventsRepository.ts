import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { MessageEvent, MessageEventType } from "@/types/communication";

interface MessageEventRow {
  id: string;
  conversation_id: string;
  type: MessageEventType;
  actor_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  actor: { name: string | null; email: string | null } | null;
}

const MESSAGE_EVENT_SELECT = `
  id, conversation_id, type, actor_id, metadata, created_at,
  actor:profiles!crm_message_events_actor_id_fkey (name, email)
`;

function mapEvent(row: MessageEventRow): MessageEvent {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    type: row.type,
    actorId: row.actor_id,
    actorName: row.actor?.name ?? row.actor?.email ?? null,
    metadata: row.metadata,
    createdAt: row.created_at,
  };
}

export async function listEventsForConversation(
  supabase: SupabaseClient,
  conversationId: string,
): Promise<MessageEvent[]> {
  const { data, error } = await supabase
    .from("crm_message_events")
    .select(MESSAGE_EVENT_SELECT)
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Falha ao carregar eventos da conversa: ${error.message}`);
  return ((data ?? []) as unknown as MessageEventRow[]).map(mapEvent);
}

export interface CreateMessageEventPayload {
  conversationId: string;
  type: MessageEventType;
  actorId: string | null;
  metadata?: Record<string, unknown> | null;
}

/** Append-only — see the migration's comment on crm_message_events: no
 * update/delete policy exists, so this is the only write path. */
export async function createMessageEvent(
  supabase: SupabaseClient,
  payload: CreateMessageEventPayload,
): Promise<void> {
  const { error } = await supabase.from("crm_message_events").insert({
    conversation_id: payload.conversationId,
    type: payload.type,
    actor_id: payload.actorId,
    metadata: payload.metadata ?? null,
  });

  if (error) throw new Error(`Falha ao registrar evento da conversa: ${error.message}`);
}
