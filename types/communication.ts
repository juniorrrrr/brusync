export type ChannelType =
  | "whatsapp"
  | "whatsapp_business_api"
  | "evolution_api"
  | "messenger"
  | "instagram_direct"
  | "email"
  | "phone"
  | "internal"
  | "outro";

export interface Channel {
  id: string;
  type: ChannelType;
  name: string;
  isActive: boolean;
}

export type ConversationStatus = "aberta" | "pendente" | "encerrada";
export type MessageDirection = "inbound" | "outbound";

export interface Conversation {
  id: string;
  channelId: string;
  channelType: ChannelType;
  channelName: string;
  crmLeadId: string | null;
  crmLeadName: string | null;
  clientId: string | null;
  clientCompany: string | null;
  ownerId: string | null;
  ownerName: string | null;
  status: ConversationStatus;
  isFavorite: boolean;
  isArchived: boolean;
  contactName: string | null;
  contactHandle: string | null;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  lastMessageDirection: MessageDirection | null;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  direction: MessageDirection;
  body: string;
  senderProfileId: string | null;
  senderName: string | null;
  createdAt: string;
}

export type MessageEventType =
  | "conversation_started"
  | "conversation_closed"
  | "conversation_reopened"
  | "message_sent"
  | "message_received"
  | "owner_changed"
  | "status_changed"
  | "favorited"
  | "unfavorited"
  | "archived"
  | "unarchived";

export interface MessageEvent {
  id: string;
  conversationId: string;
  type: MessageEventType;
  actorId: string | null;
  actorName: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface MessageTemplate {
  id: string;
  name: string;
  body: string;
  channelType: ChannelType | null;
  createdAt: string;
}

export interface ConversationDetail extends Conversation {
  messages: Message[];
  events: MessageEvent[];
}

/** Everything the Central de Comunicação's right-hand info panel needs about
 * the conversation's subject (Lead or Cliente) — origem/campanha/UTMs come
 * straight from the same source application/marketingAnalytics already
 * builds for the Lead Workspace's Marketing tab, never duplicated here. */
export interface ConversationSubjectInfo {
  crmLeadCity: string | null;
  crmLeadOrigin: string | null;
  stageLabel: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  projects: { id: string; name: string; status: string }[];
}
