import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { getConversationById } from "@/repositories/communication/conversationsRepository";
import { listEventsForConversation } from "@/repositories/communication/eventsRepository";
import { listMessagesForConversation } from "@/repositories/communication/messagesRepository";
import type { ConversationDetail } from "@/types/communication";

export async function getConversationDetail(
  supabase: SupabaseClient,
  conversationId: string,
): Promise<ConversationDetail | null> {
  const conversation = await getConversationById(supabase, conversationId);
  if (!conversation) return null;

  const [messages, events] = await Promise.all([
    listMessagesForConversation(supabase, conversationId),
    listEventsForConversation(supabase, conversationId),
  ]);

  return { ...conversation, messages, events };
}
