import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AiMessage, AiMessageRole } from "@/types/ai";

interface MessageRow {
  id: string;
  created_at: string;
  conversation_id: string;
  role: AiMessageRole;
  content: string;
  is_favorite: boolean;
}

const MESSAGE_SELECT = "id, created_at, conversation_id, role, content, is_favorite";

function mapMessage(row: MessageRow): AiMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    role: row.role,
    content: row.content,
    isFavorite: row.is_favorite,
    createdAt: row.created_at,
  };
}

export async function listMessages(
  supabase: SupabaseClient,
  conversationId: string,
): Promise<AiMessage[]> {
  const { data, error } = await supabase
    .from("ai_messages")
    .select(MESSAGE_SELECT)
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Falha ao carregar mensagens: ${error.message}`);
  return ((data ?? []) as MessageRow[]).map(mapMessage);
}

export async function listRecentMessages(
  supabase: SupabaseClient,
  limit = 10,
): Promise<AiMessage[]> {
  const { data, error } = await supabase
    .from("ai_messages")
    .select(MESSAGE_SELECT)
    .eq("role", "user")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Falha ao carregar perguntas recentes: ${error.message}`);
  return ((data ?? []) as MessageRow[]).map(mapMessage);
}

export async function listFavoriteMessages(
  supabase: SupabaseClient,
  limit = 20,
): Promise<AiMessage[]> {
  const { data, error } = await supabase
    .from("ai_messages")
    .select(MESSAGE_SELECT)
    .eq("is_favorite", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Falha ao carregar favoritos: ${error.message}`);
  return ((data ?? []) as MessageRow[]).map(mapMessage);
}

export interface CreateMessagePayload {
  conversationId: string;
  role: AiMessageRole;
  content: string;
}

export async function createMessage(
  supabase: SupabaseClient,
  payload: CreateMessagePayload,
): Promise<AiMessage> {
  const { data, error } = await supabase
    .from("ai_messages")
    .insert({
      conversation_id: payload.conversationId,
      role: payload.role,
      content: payload.content,
    })
    .select(MESSAGE_SELECT)
    .single();

  if (error) throw new Error(`Falha ao registrar mensagem: ${error.message}`);
  return mapMessage(data as MessageRow);
}

export async function setMessageFavorite(
  supabase: SupabaseClient,
  id: string,
  favorite: boolean,
): Promise<void> {
  const { error } = await supabase
    .from("ai_messages")
    .update({ is_favorite: favorite })
    .eq("id", id);
  if (error) throw new Error(`Falha ao favoritar mensagem: ${error.message}`);
}

export async function countMessages(supabase: SupabaseClient): Promise<number> {
  const { count, error } = await supabase
    .from("ai_messages")
    .select("*", { count: "exact", head: true });
  if (error) throw new Error(`Falha ao contar mensagens: ${error.message}`);
  return count ?? 0;
}
