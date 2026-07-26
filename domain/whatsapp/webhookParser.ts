import type { WhatsappMessageStatus, WhatsappMessageType } from "@/types/whatsapp";

/** Parsing puro do payload de webhook da Meta — nenhuma chamada de rede,
 * nenhum acesso a banco. app/api/webhooks/whatsapp/route.ts só valida a
 * assinatura e chama isto; services/whatsapp/whatsappWebhookService.ts é
 * quem persiste o resultado. Mantido isolado para que um futuro provider
 * (Evolution/Twilio/360dialog) só precise de um parser próprio, sem tocar
 * no resto do fluxo. */

export interface ParsedIncomingMessage {
  phoneNumberId: string;
  waId: string;
  profileName: string | null;
  waMessageId: string;
  type: WhatsappMessageType;
  body: string | null;
  mediaId: string | null;
  timestamp: string;
}

export interface ParsedStatusUpdate {
  waMessageId: string;
  status: WhatsappMessageStatus;
  timestamp: string;
  error: string | null;
}

export interface ParsedTemplateStatusUpdate {
  metaTemplateId: string;
  templateName: string;
  status: "aprovado" | "rejeitado" | "pendente";
}

export interface ParsedWebhookPayload {
  messages: ParsedIncomingMessage[];
  statuses: ParsedStatusUpdate[];
  templateUpdates: ParsedTemplateStatusUpdate[];
}

const META_TYPE_TO_INTERNAL: Record<string, WhatsappMessageType> = {
  text: "texto",
  image: "imagem",
  video: "video",
  document: "documento",
  audio: "audio",
  location: "localizacao",
  contacts: "contato",
};

const META_STATUS_TO_INTERNAL: Record<string, WhatsappMessageStatus> = {
  sent: "enviado",
  delivered: "entregue",
  read: "lido",
  failed: "falhou",
};

function mediaIdFor(message: Record<string, unknown>, type: string): string | null {
  const media = message[type] as { id?: string } | undefined;
  return media?.id ?? null;
}

function bodyFor(message: Record<string, unknown>, type: string): string | null {
  if (type === "text") return (message.text as { body?: string } | undefined)?.body ?? null;
  if (type === "location") {
    const location = message.location as { latitude?: number; longitude?: number } | undefined;
    return location ? `${location.latitude},${location.longitude}` : null;
  }
  return null;
}

export function parseWhatsappWebhookPayload(payload: unknown): ParsedWebhookPayload {
  const result: ParsedWebhookPayload = { messages: [], statuses: [], templateUpdates: [] };
  if (typeof payload !== "object" || payload === null) return result;

  const entries = (payload as { entry?: unknown[] }).entry ?? [];
  for (const entry of entries) {
    const changes = (entry as { changes?: unknown[] }).changes ?? [];
    for (const change of changes) {
      const field = (change as { field?: string }).field;
      const value = (change as { value?: Record<string, unknown> }).value ?? {};

      if (field === "messages") {
        const phoneNumberId =
          (value.metadata as { phone_number_id?: string } | undefined)?.phone_number_id ?? "";
        const contacts =
          (value.contacts as { wa_id: string; profile?: { name?: string } }[] | undefined) ?? [];
        const profileByWaId = new Map(contacts.map((c) => [c.wa_id, c.profile?.name ?? null]));

        const messages = (value.messages as Record<string, unknown>[] | undefined) ?? [];
        for (const message of messages) {
          const type = String(message.type ?? "text");
          const waId = String(message.from ?? "");
          result.messages.push({
            phoneNumberId,
            waId,
            profileName: profileByWaId.get(waId) ?? null,
            waMessageId: String(message.id ?? ""),
            type: META_TYPE_TO_INTERNAL[type] ?? "texto",
            body: bodyFor(message, type),
            mediaId: mediaIdFor(message, type),
            timestamp: String(message.timestamp ?? Date.now() / 1000),
          });
        }

        const statuses = (value.statuses as Record<string, unknown>[] | undefined) ?? [];
        for (const status of statuses) {
          const errors = status.errors as { message?: string }[] | undefined;
          result.statuses.push({
            waMessageId: String(status.id ?? ""),
            status: META_STATUS_TO_INTERNAL[String(status.status)] ?? "enviado",
            timestamp: String(status.timestamp ?? Date.now() / 1000),
            error: errors?.[0]?.message ?? null,
          });
        }
      }

      if (field === "message_template_status_update") {
        const event = String(value.event ?? "").toUpperCase();
        result.templateUpdates.push({
          metaTemplateId: String(value.message_template_id ?? ""),
          templateName: String(value.message_template_name ?? ""),
          status:
            event === "APPROVED" ? "aprovado" : event === "REJECTED" ? "rejeitado" : "pendente",
        });
      }
    }
  }

  return result;
}
