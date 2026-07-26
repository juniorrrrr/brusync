import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { parseWhatsappWebhookPayload } from "@/domain/whatsapp/webhookParser";
import { getAccountSecrets, getActiveAccount } from "@/repositories/whatsapp/accountsRepository";
import { getContactByWaId, upsertContact } from "@/repositories/whatsapp/contactsRepository";
import {
  createConversation,
  getConversationByContactId,
  updateConversation,
} from "@/repositories/whatsapp/conversationsRepository";
import { createMessage, setMessageStatusByWaId } from "@/repositories/whatsapp/messagesRepository";
import { updateTemplateStatusByMetaId } from "@/repositories/whatsapp/templatesRepository";
import { logWebhookEvent } from "@/repositories/whatsapp/webhooksRepository";
import { decryptToken } from "@/services/metaConversionsApi/tokenCrypto";

/** Chamada só por app/api/webhooks/whatsapp/route.ts — a única rota HTTP
 * pública deste módulo (a Meta entrega eventos aqui, sem sessão do CRM).
 * Recebe o payload já com a assinatura validada; persiste tudo através dos
 * mesmos repositórios usados pelo Chat (nenhuma regra duplicada). */

export async function verifyWebhookSignature(
  supabase: SupabaseClient,
  accountId: string,
  rawBody: string,
  signatureHeader: string | null,
): Promise<boolean> {
  if (!signatureHeader?.startsWith("sha256=")) return false;

  const secrets = await getAccountSecrets(supabase, accountId);
  if (!secrets?.app_secret_ciphertext || !secrets.app_secret_iv) return false;

  const appSecret = decryptToken(secrets.app_secret_ciphertext, secrets.app_secret_iv);
  const expected = createHmac("sha256", appSecret).update(rawBody, "utf8").digest("hex");
  const provided = signatureHeader.slice("sha256=".length);

  const expectedBuffer = Buffer.from(expected, "hex");
  const providedBuffer = Buffer.from(provided, "hex");
  if (expectedBuffer.length !== providedBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, providedBuffer);
}

export async function getVerifyToken(
  supabase: SupabaseClient,
  accountId: string,
): Promise<string | null> {
  const secrets = await getAccountSecrets(supabase, accountId);
  if (!secrets?.webhook_verify_token_ciphertext || !secrets.webhook_verify_token_iv) return null;
  return decryptToken(secrets.webhook_verify_token_ciphertext, secrets.webhook_verify_token_iv);
}

export async function processWebhookPayload(
  supabase: SupabaseClient,
  rawPayload: unknown,
): Promise<void> {
  const account = await getActiveAccount(supabase);
  const parsed = parseWhatsappWebhookPayload(rawPayload);

  try {
    for (const incoming of parsed.messages) {
      if (!account) continue;

      let contact = await getContactByWaId(supabase, account.id, incoming.waId);
      if (!contact) {
        contact = await upsertContact(supabase, {
          accountId: account.id,
          waId: incoming.waId,
          profileName: incoming.profileName,
          phoneNumber: incoming.waId,
        });
      }

      let conversation = await getConversationByContactId(supabase, contact.id);
      if (!conversation) {
        conversation = await createConversation(supabase, account.id, contact.id);
      }

      await createMessage(supabase, {
        conversationId: conversation.id,
        direction: "inbound",
        type: incoming.type,
        body: incoming.body,
        waMessageId: incoming.waMessageId,
        status: "entregue",
      });

      await updateConversation(supabase, conversation.id, {
        lastMessageAt: new Date(Number(incoming.timestamp) * 1000).toISOString(),
        lastMessagePreview: incoming.body ?? `[${incoming.type}]`,
        unreadCount: conversation.unreadCount + 1,
        status: "aberta",
      });
    }

    for (const statusUpdate of parsed.statuses) {
      await setMessageStatusByWaId(
        supabase,
        statusUpdate.waMessageId,
        statusUpdate.status,
        statusUpdate.error,
      );
    }

    for (const templateUpdate of parsed.templateUpdates) {
      await updateTemplateStatusByMetaId(
        supabase,
        templateUpdate.metaTemplateId,
        templateUpdate.status,
      );
    }

    await logWebhookEvent(supabase, {
      accountId: account?.id ?? null,
      eventType:
        parsed.messages.length > 0
          ? "messages"
          : parsed.templateUpdates.length > 0
            ? "message_template_status_update"
            : "status",
      payload: rawPayload,
      processed: true,
    });
  } catch (error) {
    await logWebhookEvent(supabase, {
      accountId: account?.id ?? null,
      eventType: "error",
      payload: rawPayload,
      processed: false,
      error: error instanceof Error ? error.message : "Falha ao processar webhook.",
    });
  }
}
