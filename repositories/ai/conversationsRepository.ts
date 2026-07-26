import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AiContextType, AiConversation, AiConversationStatus } from "@/types/ai";

interface ConversationRow {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  context_type: AiContextType;
  context_ref: string | null;
  status: AiConversationStatus;
  created_by: string | null;
}

const CONVERSATION_SELECT =
  "id, created_at, updated_at, title, context_type, context_ref, status, created_by";

function mapConversation(row: ConversationRow): AiConversation {
  return {
    id: row.id,
    title: row.title,
    contextType: row.context_type,
    contextRef: row.context_ref,
    status: row.status,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface ListConversationsOptions {
  status?: AiConversationStatus;
  contextType?: AiContextType;
  limit?: number;
}

export async function listConversations(
  supabase: SupabaseClient,
  options: ListConversationsOptions = {},
): Promise<AiConversation[]> {
  let query = supabase.from("ai_conversations").select(CONVERSATION_SELECT);
  if (options.status) query = query.eq("status", options.status);
  if (options.contextType) query = query.eq("context_type", options.contextType);

  query = query.order("updated_at", { ascending: false });
  if (options.limit) query = query.limit(options.limit);

  const { data, error } = await query;
  if (error) throw new Error(`Falha ao carregar conversas: ${error.message}`);
  return ((data ?? []) as ConversationRow[]).map(mapConversation);
}

export async function getConversationById(
  supabase: SupabaseClient,
  id: string,
): Promise<AiConversation | null> {
  const { data, error } = await supabase
    .from("ai_conversations")
    .select(CONVERSATION_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Falha ao carregar conversa: ${error.message}`);
  if (!data) return null;
  return mapConversation(data as ConversationRow);
}

export interface CreateConversationPayload {
  title: string;
  contextType: AiContextType;
  contextRef: string | null;
  createdBy: string | null;
}

export async function createConversation(
  supabase: SupabaseClient,
  payload: CreateConversationPayload,
): Promise<AiConversation> {
  const { data, error } = await supabase
    .from("ai_conversations")
    .insert({
      title: payload.title,
      context_type: payload.contextType,
      context_ref: payload.contextRef,
      created_by: payload.createdBy,
    })
    .select(CONVERSATION_SELECT)
    .single();

  if (error) throw new Error(`Falha ao criar conversa: ${error.message}`);
  return mapConversation(data as ConversationRow);
}

export async function touchConversation(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase
    .from("ai_conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(`Falha ao atualizar conversa: ${error.message}`);
}

export async function archiveConversation(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase
    .from("ai_conversations")
    .update({ status: "arquivada" })
    .eq("id", id);
  if (error) throw new Error(`Falha ao arquivar conversa: ${error.message}`);
}
