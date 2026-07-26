import "server-only";

import { randomUUID } from "node:crypto";
import {
  getDemoAiConversationDetail,
  getDemoAiConversations,
  getDemoAiFavoriteMessages,
  getDemoAiPrompts,
  getDemoAiRecentQuestions,
} from "@/lib/demo/mockAi";
import {
  createConversation as createConversationRow,
  getConversationById,
  listConversations,
  touchConversation,
} from "@/repositories/ai/conversationsRepository";
import { createFeedback as createFeedbackRow } from "@/repositories/ai/feedbackRepository";
import {
  createMessage as createMessageRow,
  listMessages,
  setMessageFavorite,
} from "@/repositories/ai/messagesRepository";
import {
  createPrompt as createPromptRow,
  deletePrompt as deletePromptRow,
  listPrompts,
} from "@/repositories/ai/promptsRepository";
import { logUsage } from "@/repositories/ai/usageRepository";
import { buildChatContext } from "@/services/ai/aiContextService";
import { getAiProvider } from "@/services/ai/aiProviderFactory";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type {
  AiChatPageData,
  AiContextType,
  AiConversationDetail,
  AiFeedbackRating,
  AiFeedbackTargetType,
  AiMessage,
  AiPrompt,
} from "@/types/ai";

/** Todo envio de pergunta passa por aqui — é a ÚNICA função que chama
 * services/ai/aiProviderFactory.ts::getAiProvider(). Em Modo Demonstração o
 * fluxo de leitura/geração roda 100% (o módulo precisa funcionar
 * integralmente em demo), só a escrita no Supabase é pulada — mesmo
 * princípio de "nunca gravar dados reais" já usado nas fases anteriores,
 * aplicado aqui de um jeito que não quebra a experiência do chat: a
 * conversa fica só na memória do cliente para aquela sessão. */
export async function sendAiMessage(params: {
  conversationId: string | null;
  contextType: AiContextType;
  contextRef: string | null;
  question: string;
  attempt?: number;
  createdBy: string | null;
}): Promise<{ conversationId: string; userMessage: AiMessage; assistantMessage: AiMessage }> {
  const now = new Date().toISOString();
  const context = await buildChatContext(params.contextType, params.contextRef, params.question);
  const provider = getAiProvider();
  const answer = await provider.generateAnswer({
    question: params.question,
    context,
    history: [],
    attempt: params.attempt ?? 0,
  });

  if (await isDemoModeActive()) {
    const conversationId = params.conversationId ?? randomUUID();
    return {
      conversationId,
      userMessage: {
        id: randomUUID(),
        conversationId,
        role: "user",
        content: params.question,
        isFavorite: false,
        createdAt: now,
      },
      assistantMessage: {
        id: randomUUID(),
        conversationId,
        role: "assistant",
        content: answer.content,
        isFavorite: false,
        createdAt: now,
      },
    };
  }

  const supabase = await getSupabaseAuthClient();
  const conversationId =
    params.conversationId ??
    (
      await createConversationRow(supabase, {
        title: params.question.slice(0, 60),
        contextType: params.contextType,
        contextRef: params.contextRef,
        createdBy: params.createdBy,
      })
    ).id;

  const userMessage = await createMessageRow(supabase, {
    conversationId,
    role: "user",
    content: params.question,
  });
  const assistantMessage = await createMessageRow(supabase, {
    conversationId,
    role: "assistant",
    content: answer.content,
  });
  await touchConversation(supabase, conversationId);
  await logUsage(supabase, {
    actionType: "pergunta",
    module: params.contextType,
    createdBy: params.createdBy,
  });

  return { conversationId, userMessage, assistantMessage };
}

export async function regenerateAiAnswer(params: {
  conversationId: string;
  contextType: AiContextType;
  contextRef: string | null;
  question: string;
  attempt: number;
  createdBy: string | null;
}): Promise<AiMessage> {
  const context = await buildChatContext(params.contextType, params.contextRef, params.question);
  const provider = getAiProvider();
  const answer = await provider.generateAnswer({
    question: params.question,
    context,
    history: [],
    attempt: params.attempt,
  });
  const now = new Date().toISOString();

  if (await isDemoModeActive()) {
    return {
      id: randomUUID(),
      conversationId: params.conversationId,
      role: "assistant",
      content: answer.content,
      isFavorite: false,
      createdAt: now,
    };
  }

  const supabase = await getSupabaseAuthClient();
  const message = await createMessageRow(supabase, {
    conversationId: params.conversationId,
    role: "assistant",
    content: answer.content,
  });
  await touchConversation(supabase, params.conversationId);
  return message;
}

export async function toggleAiMessageFavorite(id: string, favorite: boolean): Promise<void> {
  if (await isDemoModeActive()) return;
  const supabase = await getSupabaseAuthClient();
  await setMessageFavorite(supabase, id, favorite);
}

export async function submitAiFeedback(params: {
  targetType: AiFeedbackTargetType;
  targetId: string;
  rating: AiFeedbackRating;
  createdBy: string | null;
}): Promise<void> {
  if (await isDemoModeActive()) return;
  const supabase = await getSupabaseAuthClient();
  await createFeedbackRow(supabase, params);
}

export async function getAiPrompts(): Promise<AiPrompt[]> {
  if (await isDemoModeActive()) return getDemoAiPrompts();
  const supabase = await getSupabaseAuthClient();
  return listPrompts(supabase);
}

export async function createAiPrompt(params: {
  title: string;
  content: string;
  category: string | null;
  createdBy: string | null;
}): Promise<void> {
  if (await isDemoModeActive()) return;
  const supabase = await getSupabaseAuthClient();
  await createPromptRow(supabase, params);
}

export async function deleteAiPrompt(id: string): Promise<void> {
  if (await isDemoModeActive()) return;
  const supabase = await getSupabaseAuthClient();
  await deletePromptRow(supabase, id);
}

async function getConversationDetail(id: string): Promise<AiConversationDetail | null> {
  if (await isDemoModeActive()) return getDemoAiConversationDetail(id);
  const supabase = await getSupabaseAuthClient();
  const conversation = await getConversationById(supabase, id);
  if (!conversation) return null;
  const messages = await listMessages(supabase, id);
  return { ...conversation, messages };
}

export async function getAiChatPageData(conversationId?: string): Promise<AiChatPageData> {
  const [conversations, prompts] = await Promise.all([
    (async () => {
      if (await isDemoModeActive()) return getDemoAiConversations();
      const supabase = await getSupabaseAuthClient();
      return listConversations(supabase, { status: "ativa", limit: 50 });
    })(),
    getAiPrompts(),
  ]);

  const resolvedId = conversationId ?? conversations[0]?.id;
  const activeConversation = resolvedId ? await getConversationDetail(resolvedId) : null;

  return { conversations, prompts, activeConversation };
}

export async function getAiRecentQuestions(limit = 10): Promise<AiMessage[]> {
  if (await isDemoModeActive()) return getDemoAiRecentQuestions(limit);
  const supabase = await getSupabaseAuthClient();
  const { listRecentMessages } = await import("@/repositories/ai/messagesRepository");
  return listRecentMessages(supabase, limit);
}

export async function getAiFavoriteMessages(): Promise<AiMessage[]> {
  if (await isDemoModeActive()) return getDemoAiFavoriteMessages();
  const supabase = await getSupabaseAuthClient();
  const { listFavoriteMessages } = await import("@/repositories/ai/messagesRepository");
  return listFavoriteMessages(supabase);
}
