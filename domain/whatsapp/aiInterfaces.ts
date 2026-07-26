/** Preparação para a Fase 31 (IA aplicada à Comunicação) — só a interface.
 * Nenhuma implementação chama OpenAI, Claude ou qualquer provedor externo
 * nesta fase; nenhum componente sequer importa isto ainda. Quando a Fase 31
 * existir, uma implementação (provavelmente reaproveitando
 * domain/ai/provider.ts::AiProvider da Fase 26) é ligada num único ponto,
 * mesmo espírito de services/whatsapp/whatsappProviderFactory.ts. */

export interface WhatsappAiSuggestReplyInput {
  conversationId: string;
  lastMessages: { direction: "inbound" | "outbound"; body: string }[];
}

export interface WhatsappAiSummaryInput {
  conversationId: string;
  messages: { direction: "inbound" | "outbound"; body: string; createdAt: string }[];
}

export type WhatsappAiIntent = "duvida" | "reclamacao" | "interesse_compra" | "suporte" | "outro";
export type WhatsappAiSentiment = "positivo" | "neutro" | "negativo";

export interface WhatsappAiAssistant {
  suggestReply(input: WhatsappAiSuggestReplyInput): Promise<string>;
  summarizeConversation(input: WhatsappAiSummaryInput): Promise<string>;
  extractTasks(input: WhatsappAiSummaryInput): Promise<string[]>;
  detectIntent(input: WhatsappAiSuggestReplyInput): Promise<WhatsappAiIntent>;
  classifySentiment(input: WhatsappAiSuggestReplyInput): Promise<WhatsappAiSentiment>;
}
