import "server-only";

import type { AiProvider } from "@/domain/ai/provider";
import { getSimulatedAiProvider } from "@/domain/ai/simulatedProvider";

/** Fábrica única do provedor de IA — hoje sempre devolve o provedor
 * simulado (nenhuma chamada externa nesta fase, por decisão explícita do
 * escopo da Fase 26). Quando um provedor real for adicionado (OpenAI/
 * Claude/Gemini), ele implementa `AiProvider` (domain/ai/provider.ts) e este
 * é o ÚNICO arquivo que muda para ativá-lo — nenhum outro lugar do sistema
 * conhece o provedor concreto. */
export function getAiProvider(): AiProvider {
  return getSimulatedAiProvider();
}
