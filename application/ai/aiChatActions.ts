"use server";

import { revalidatePath } from "next/cache";
import { requireCrmProfile } from "@/application/crm/authGuard";
import {
  regenerateAiAnswer,
  sendAiMessage,
  submitAiFeedback,
  toggleAiMessageFavorite,
} from "@/services/ai/aiChatService";
import type { AiContextType, AiFeedbackRating, AiFeedbackTargetType, AiMessage } from "@/types/ai";

export interface SendAiMessageResult {
  conversationId: string;
  userMessage: AiMessage;
  assistantMessage: AiMessage;
}

/** Toda pergunta do Chat IA passa por esta action — que delega 100% para
 * services/ai/aiChatService.ts::sendAiMessage (a única função que chama o
 * AiProvider). Chamada diretamente pelo cliente (não via useActionState)
 * porque o hook de chat precisa do par de mensagens tipado de volta para
 * atualizar a UI, não de um FormData. */
export async function sendAiMessageAction(params: {
  conversationId: string | null;
  contextType: AiContextType;
  contextRef: string | null;
  question: string;
}): Promise<SendAiMessageResult> {
  const profile = await requireCrmProfile();
  const question = params.question.trim();
  if (!question) throw new Error("Digite uma pergunta.");

  const result = await sendAiMessage({ ...params, question, createdBy: profile.id });
  revalidatePath("/ia");
  return result;
}

export async function regenerateAiMessageAction(params: {
  conversationId: string;
  contextType: AiContextType;
  contextRef: string | null;
  question: string;
  attempt: number;
}): Promise<AiMessage> {
  const profile = await requireCrmProfile();
  const message = await regenerateAiAnswer({ ...params, createdBy: profile.id });
  revalidatePath("/ia");
  return message;
}

export async function toggleAiMessageFavoriteAction(
  id: string,
  favorite: boolean,
): Promise<{ ok: boolean }> {
  await requireCrmProfile();
  await toggleAiMessageFavorite(id, favorite);
  return { ok: true };
}

export async function submitAiFeedbackAction(
  targetType: AiFeedbackTargetType,
  targetId: string,
  rating: AiFeedbackRating,
): Promise<{ ok: boolean }> {
  const profile = await requireCrmProfile();
  await submitAiFeedback({ targetType, targetId, rating, createdBy: profile.id });
  return { ok: true };
}
