import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Message, MessageDirection } from "@/types/communication";

interface MessageRow {
  id: string;
  conversation_id: string;
  direction: MessageDirection;
  body: string;
  sender_profile_id: string | null;
  sender_name: string | null;
  created_at: string;
}

const MESSAGE_SELECT =
  "id, conversation_id, direction, body, sender_profile_id, sender_name, created_at";

function mapMessage(row: MessageRow): Message {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    direction: row.direction,
    body: row.body,
    senderProfileId: row.sender_profile_id,
    senderName: row.sender_name,
    createdAt: row.created_at,
  };
}

export async function listMessagesForConversation(
  supabase: SupabaseClient,
  conversationId: string,
): Promise<Message[]> {
  const { data, error } = await supabase
    .from("crm_messages")
    .select(MESSAGE_SELECT)
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Falha ao carregar mensagens: ${error.message}`);
  return ((data ?? []) as unknown as MessageRow[]).map(mapMessage);
}

export interface CreateMessagePayload {
  conversationId: string;
  direction: MessageDirection;
  body: string;
  senderProfileId: string | null;
  senderName: string | null;
}

export async function createMessage(
  supabase: SupabaseClient,
  payload: CreateMessagePayload,
): Promise<Message> {
  const { data, error } = await supabase
    .from("crm_messages")
    .insert({
      conversation_id: payload.conversationId,
      direction: payload.direction,
      body: payload.body,
      sender_profile_id: payload.senderProfileId,
      sender_name: payload.senderName,
    })
    .select(MESSAGE_SELECT)
    .single();

  if (error) throw new Error(`Falha ao enviar mensagem: ${error.message}`);
  return mapMessage(data as unknown as MessageRow);
}
