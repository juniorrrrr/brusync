import type { AiContextType } from "@/types/ai";

/** Camada de abstração exigida pela Fase 26 — toda resposta de IA passa por
 * aqui, nunca chamando um provedor externo diretamente de
 * services/ai/aiChatService.ts. Hoje só existe `SimulatedAiProvider`
 * (domain/ai/simulatedProvider.ts); trocar de provedor no futuro (OpenAI,
 * Claude, Gemini) significa implementar esta interface e trocar o retorno de
 * services/ai/aiProviderFactory.ts::getAiProvider — nenhum outro arquivo
 * muda. */

export interface AiProviderContextFact {
  label: string;
  value: string;
}

/** Contexto já resolvido (dados reais lidos dos módulos existentes) que o
 * provedor usa para montar a resposta — nunca o provedor busca dado algum
 * por conta própria. */
export interface AiProviderContext {
  type: AiContextType;
  label: string;
  facts: AiProviderContextFact[];
  knowledgeMatches: { title: string; summary: string | null }[];
}

export interface AiProviderMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AiGenerateAnswerInput {
  question: string;
  context: AiProviderContext;
  history: AiProviderMessage[];
  /** Incrementado a cada "Regenerar" — permite ao provedor variar a resposta
   * sem repetir a mesma frase. */
  attempt: number;
}

export interface AiGenerateAnswerResult {
  content: string;
}

export interface AiProvider {
  readonly name: string;
  generateAnswer(input: AiGenerateAnswerInput): Promise<AiGenerateAnswerResult>;
}
