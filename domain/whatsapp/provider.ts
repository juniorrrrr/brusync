/** Camada de abstração exigida pela Fase 28 — nenhuma camada da aplicação
 * conhece a Graph API da Meta diretamente; tudo passa por esta interface.
 * A troca de provider (Evolution, Twilio, 360dialog) no futuro é só uma
 * nova classe implementando `WhatsappProvider` + um novo `case` em
 * services/whatsapp/whatsappProviderFactory.ts — nenhum outro arquivo
 * muda. */

export interface WhatsappProviderCredentials {
  phoneNumberId: string;
  wabaId: string;
  accessToken: string;
}

export interface SendTextMessageInput {
  to: string;
  body: string;
}

export interface SendTemplateMessageInput {
  to: string;
  templateName: string;
  language: string;
  variables?: string[];
}

export interface SendMediaMessageInput {
  to: string;
  mediaId: string;
  kind: "imagem" | "video" | "documento" | "audio";
  caption?: string;
}

export interface SendMessageResult {
  waMessageId: string;
}

export interface UploadMediaInput {
  fileName: string;
  mimeType: string;
  data: Buffer;
}

export interface UploadMediaResult {
  mediaId: string;
}

export interface RemoteTemplateSummary {
  name: string;
  category: "marketing" | "utility" | "authentication";
  language: string;
  status: "pendente" | "aprovado" | "rejeitado";
  metaTemplateId: string;
  components: { type: "header" | "body" | "footer" | "buttons"; text?: string }[];
}

export interface ValidateCredentialsResult {
  ok: boolean;
  displayPhoneNumber?: string;
  displayName?: string;
  error?: string;
}

/** Toda implementação (MetaCloudProvider hoje; EvolutionProvider/
 * TwilioProvider/Dialog360Provider no futuro) recebe as credenciais já
 * resolvidas (descriptografadas) por quem a instancia — nunca lê
 * variável de ambiente ou tabela por conta própria. */
export interface WhatsappProvider {
  readonly name: string;
  validateCredentials(credentials: WhatsappProviderCredentials): Promise<ValidateCredentialsResult>;
  sendTextMessage(
    credentials: WhatsappProviderCredentials,
    input: SendTextMessageInput,
  ): Promise<SendMessageResult>;
  sendTemplateMessage(
    credentials: WhatsappProviderCredentials,
    input: SendTemplateMessageInput,
  ): Promise<SendMessageResult>;
  sendMediaMessage(
    credentials: WhatsappProviderCredentials,
    input: SendMediaMessageInput,
  ): Promise<SendMessageResult>;
  uploadMedia(
    credentials: WhatsappProviderCredentials,
    input: UploadMediaInput,
  ): Promise<UploadMediaResult>;
  getMediaUrl(credentials: WhatsappProviderCredentials, mediaId: string): Promise<string>;
  listApprovedTemplates(credentials: WhatsappProviderCredentials): Promise<RemoteTemplateSummary[]>;
}
