import "server-only";

import type {
  RemoteTemplateSummary,
  SendMediaMessageInput,
  SendMessageResult,
  SendTemplateMessageInput,
  SendTextMessageInput,
  UploadMediaInput,
  UploadMediaResult,
  ValidateCredentialsResult,
  WhatsappProvider,
  WhatsappProviderCredentials,
} from "@/domain/whatsapp/provider";

const GRAPH_API_BASE = "https://graph.facebook.com/v19.0";

const MEDIA_TYPE_FIELD: Record<SendMediaMessageInput["kind"], string> = {
  imagem: "image",
  video: "video",
  documento: "document",
  audio: "audio",
};

async function graphRequest(path: string, accessToken: string, init?: RequestInit) {
  const response = await fetch(`${GRAPH_API_BASE}/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init?.headers ?? {}),
    },
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = data?.error?.message ?? `Erro ${response.status} na Graph API.`;
    throw new Error(message);
  }
  return data;
}

/** Única implementação real desta fase — chama a Graph API da Meta
 * diretamente. Nenhuma outra camada da aplicação importa este arquivo;
 * tudo passa por services/whatsapp/whatsappProviderFactory.ts. */
export class MetaCloudProvider implements WhatsappProvider {
  readonly name = "meta_cloud";

  async validateCredentials(
    credentials: WhatsappProviderCredentials,
  ): Promise<ValidateCredentialsResult> {
    try {
      const data = await graphRequest(
        `${credentials.phoneNumberId}?fields=display_phone_number,verified_name`,
        credentials.accessToken,
      );
      return {
        ok: true,
        displayPhoneNumber: data.display_phone_number,
        displayName: data.verified_name,
      };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Falha ao validar credenciais.",
      };
    }
  }

  async sendTextMessage(
    credentials: WhatsappProviderCredentials,
    input: SendTextMessageInput,
  ): Promise<SendMessageResult> {
    const data = await graphRequest(
      `${credentials.phoneNumberId}/messages`,
      credentials.accessToken,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: input.to,
          type: "text",
          text: { body: input.body },
        }),
      },
    );
    return { waMessageId: data.messages?.[0]?.id };
  }

  async sendTemplateMessage(
    credentials: WhatsappProviderCredentials,
    input: SendTemplateMessageInput,
  ): Promise<SendMessageResult> {
    const components = input.variables?.length
      ? [
          {
            type: "body",
            parameters: input.variables.map((text) => ({ type: "text", text })),
          },
        ]
      : undefined;

    const data = await graphRequest(
      `${credentials.phoneNumberId}/messages`,
      credentials.accessToken,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: input.to,
          type: "template",
          template: {
            name: input.templateName,
            language: { code: input.language },
            ...(components ? { components } : {}),
          },
        }),
      },
    );
    return { waMessageId: data.messages?.[0]?.id };
  }

  async sendMediaMessage(
    credentials: WhatsappProviderCredentials,
    input: SendMediaMessageInput,
  ): Promise<SendMessageResult> {
    const field = MEDIA_TYPE_FIELD[input.kind];
    const data = await graphRequest(
      `${credentials.phoneNumberId}/messages`,
      credentials.accessToken,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: input.to,
          type: field,
          [field]: { id: input.mediaId, ...(input.caption ? { caption: input.caption } : {}) },
        }),
      },
    );
    return { waMessageId: data.messages?.[0]?.id };
  }

  async uploadMedia(
    credentials: WhatsappProviderCredentials,
    input: UploadMediaInput,
  ): Promise<UploadMediaResult> {
    const form = new FormData();
    form.append("messaging_product", "whatsapp");
    form.append(
      "file",
      new Blob([new Uint8Array(input.data)], { type: input.mimeType }),
      input.fileName,
    );

    const data = await graphRequest(`${credentials.phoneNumberId}/media`, credentials.accessToken, {
      method: "POST",
      body: form,
    });
    return { mediaId: data.id };
  }

  async getMediaUrl(credentials: WhatsappProviderCredentials, mediaId: string): Promise<string> {
    const data = await graphRequest(mediaId, credentials.accessToken);
    return data.url;
  }

  async listApprovedTemplates(
    credentials: WhatsappProviderCredentials,
  ): Promise<RemoteTemplateSummary[]> {
    const data = await graphRequest(
      `${credentials.wabaId}/message_templates?fields=name,category,language,status,components,id&limit=100`,
      credentials.accessToken,
    );

    return ((data.data ?? []) as Record<string, unknown>[]).map((row) => ({
      name: String(row.name),
      category: String(row.category).toLowerCase() as RemoteTemplateSummary["category"],
      language: String(row.language),
      status: mapMetaStatus(String(row.status)),
      metaTemplateId: String(row.id),
      components: ((row.components as { type: string; text?: string }[] | undefined) ?? []).map(
        (c) => ({
          type: c.type.toLowerCase() as "header" | "body" | "footer" | "buttons",
          text: c.text,
        }),
      ),
    }));
  }
}

function mapMetaStatus(status: string): "pendente" | "aprovado" | "rejeitado" {
  const normalized = status.toUpperCase();
  if (normalized === "APPROVED") return "aprovado";
  if (normalized === "REJECTED") return "rejeitado";
  return "pendente";
}
