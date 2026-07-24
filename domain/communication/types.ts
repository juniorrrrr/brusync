import type { ComponentType } from "react";
import {
  IconArrowSwap,
  IconBuilding,
  IconMail,
  IconMessage,
  IconPhone,
  type IconProps,
  IconUsers,
} from "@/components/ui/icons";
import type { ChannelType, ConversationStatus, MessageEventType } from "@/types/communication";

export const CHANNEL_TYPES: ChannelType[] = [
  "whatsapp",
  "whatsapp_business_api",
  "evolution_api",
  "messenger",
  "instagram_direct",
  "email",
  "phone",
  "internal",
  "outro",
];

export const CHANNEL_TYPE_LABEL: Record<ChannelType, string> = {
  whatsapp: "WhatsApp",
  whatsapp_business_api: "WhatsApp Business Cloud API",
  evolution_api: "Evolution API",
  messenger: "Messenger",
  instagram_direct: "Instagram Direct",
  email: "E-mail",
  phone: "Telefone",
  internal: "Chat interno",
  outro: "Outro",
};

export const CHANNEL_TYPE_ICON: Record<ChannelType, ComponentType<IconProps>> = {
  whatsapp: IconMessage,
  whatsapp_business_api: IconMessage,
  evolution_api: IconArrowSwap,
  messenger: IconMessage,
  instagram_direct: IconMessage,
  email: IconMail,
  phone: IconPhone,
  internal: IconUsers,
  outro: IconBuilding,
};

export const CONVERSATION_STATUSES: ConversationStatus[] = ["aberta", "pendente", "encerrada"];

export const CONVERSATION_STATUS_LABEL: Record<ConversationStatus, string> = {
  aberta: "Aberta",
  pendente: "Pendente",
  encerrada: "Encerrada",
};

export function conversationStatusBadge(status: ConversationStatus): string {
  switch (status) {
    case "aberta":
      return "ok";
    case "pendente":
      return "warn";
    default:
      return "neutral";
  }
}

export const MESSAGE_EVENT_LABEL: Record<MessageEventType, string> = {
  conversation_started: "Conversa iniciada",
  conversation_closed: "Conversa encerrada",
  conversation_reopened: "Conversa reaberta",
  message_sent: "Mensagem enviada",
  message_received: "Mensagem recebida",
  owner_changed: "Responsável alterado",
  status_changed: "Status alterado",
  favorited: "Marcada como favorita",
  unfavorited: "Removida dos favoritos",
  archived: "Arquivada",
  unarchived: "Desarquivada",
};

/** "Tempo sem resposta" for the conversation list — how long since the last
 * message, colored red once it crosses the SLA-ish threshold below. Purely a
 * display affordance, not a stored value. */
const STALE_THRESHOLD_MS = 2 * 60 * 60 * 1000;

export function isConversationStale(lastMessageAt: string | null): boolean {
  if (!lastMessageAt) return false;
  return Date.now() - new Date(lastMessageAt).getTime() > STALE_THRESHOLD_MS;
}
