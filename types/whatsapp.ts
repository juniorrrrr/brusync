/** WhatsApp Business Cloud API — Fase 28. Toda comunicação com a Meta
 * passa por domain/whatsapp/provider.ts::WhatsappProvider — nenhum tipo
 * aqui conhece a forma exata do payload da Graph API; os mapeamentos
 * ficam isolados em services/whatsapp/metaCloudProvider.ts. */

export type WhatsappAccountStatus = "conectado" | "desconectado" | "erro";

export interface WhatsappAccount {
  id: string;
  phoneNumberId: string;
  wabaId: string;
  displayPhoneNumber: string | null;
  displayName: string | null;
  status: WhatsappAccountStatus;
  lastSyncAt: string | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WhatsappContact {
  id: string;
  accountId: string;
  waId: string;
  profileName: string | null;
  phoneNumber: string;
  crmLeadId: string | null;
  clientId: string | null;
  optedIn: boolean;
  createdAt: string;
}

export type WhatsappConversationStatus = "aberta" | "pendente" | "encerrada";

export interface WhatsappConversation {
  id: string;
  accountId: string;
  contact: WhatsappContact;
  status: WhatsappConversationStatus;
  isFavorite: boolean;
  isArchived: boolean;
  ownerId: string | null;
  ownerName: string | null;
  crmLeadId: string | null;
  crmLeadName: string | null;
  clientId: string | null;
  clientCompany: string | null;
  projectId: string | null;
  projectName: string | null;
  labels: WhatsappLabel[];
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  lastMessageDirection: WhatsappMessageDirection | null;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export type WhatsappMessageDirection = "inbound" | "outbound";

export type WhatsappMessageType =
  | "texto"
  | "imagem"
  | "video"
  | "documento"
  | "audio"
  | "localizacao"
  | "contato"
  | "template";

export type WhatsappMessageStatus = "pendente" | "enviado" | "entregue" | "lido" | "falhou";

export interface WhatsappMessage {
  id: string;
  conversationId: string;
  direction: WhatsappMessageDirection;
  type: WhatsappMessageType;
  body: string | null;
  attachment: WhatsappAttachment | null;
  templateName: string | null;
  waMessageId: string | null;
  status: WhatsappMessageStatus;
  error: string | null;
  senderProfileId: string | null;
  senderName: string | null;
  createdAt: string;
}

export type WhatsappAttachmentKind = "imagem" | "video" | "documento" | "audio";

export interface WhatsappAttachment {
  id: string;
  conversationId: string | null;
  storagePath: string;
  fileName: string;
  mimeType: string | null;
  fileSize: number | null;
  kind: WhatsappAttachmentKind;
  createdAt: string;
}

export type WhatsappTemplateCategory = "marketing" | "utility" | "authentication";
export type WhatsappTemplateStatus = "pendente" | "aprovado" | "rejeitado";

export interface WhatsappTemplateComponent {
  type: "header" | "body" | "footer" | "buttons";
  text?: string;
  variables?: string[];
}

export interface WhatsappTemplate {
  id: string;
  accountId: string;
  name: string;
  category: WhatsappTemplateCategory;
  language: string;
  status: WhatsappTemplateStatus;
  components: WhatsappTemplateComponent[];
  metaTemplateId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WhatsappLabel {
  id: string;
  name: string;
  color: string;
}

export type WhatsappAutomationTrigger =
  | "novo_lead"
  | "mudanca_pipeline"
  | "venda_concluida"
  | "pagamento_recebido"
  | "projeto_iniciado"
  | "projeto_finalizado"
  | "agendamento_confirmado"
  | "aniversario"
  | "lembrete";

export type WhatsappAutomationStatus = "ativo" | "inativo";

export interface WhatsappAutomation {
  id: string;
  accountId: string;
  triggerType: WhatsappAutomationTrigger;
  templateId: string | null;
  templateName: string | null;
  status: WhatsappAutomationStatus;
  config: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface WhatsappWebhookLogEntry {
  id: string;
  accountId: string | null;
  eventType: string;
  processed: boolean;
  error: string | null;
  createdAt: string;
}

export interface WhatsappDashboardData {
  account: WhatsappAccount | null;
  messagesSent: number;
  messagesReceived: number;
  averageResponseMinutes: number | null;
  openConversations: number;
  closedConversations: number;
  templatesSent: number;
  failures: number;
}

export interface WhatsappConversationsPageData {
  conversations: WhatsappConversation[];
  labels: WhatsappLabel[];
  owners: { id: string; name: string | null; email: string | null }[];
}

export interface WhatsappConversationDetail extends WhatsappConversation {
  messages: WhatsappMessage[];
}

export interface WhatsappTemplatesPageData {
  templates: WhatsappTemplate[];
}

export interface WhatsappAutomationsPageData {
  automations: WhatsappAutomation[];
  templates: WhatsappTemplate[];
}
