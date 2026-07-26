import type {
  AiGenerateAnswerInput,
  AiGenerateAnswerResult,
  AiProvider,
  AiProviderContext,
} from "@/domain/ai/provider";

function pick<T>(items: T[], attempt: number): T {
  return items[attempt % items.length];
}

function factsBlock(context: AiProviderContext): string {
  if (context.facts.length === 0) return "";
  return context.facts.map((fact) => `• ${fact.label}: ${fact.value}`).join("\n");
}

const GREETING_OPENERS = [
  "Olá! Analisando os dados disponíveis",
  "Oi! Com base nas informações que já temos no sistema",
  "Certo, olhando o que temos registrado",
];

const KNOWLEDGE_OPENERS = [
  "Encontrei o seguinte na Base de Conhecimento",
  "Segundo os documentos internos já cadastrados",
];

const GENERIC_CLOSERS = [
  "Posso detalhar algum desses pontos.",
  "Quer que eu aprofunde em algum item específico?",
  "Me diga se quiser que eu foque em outro ângulo.",
];

function matchesAny(question: string, keywords: string[]): boolean {
  const normalized = question.toLowerCase();
  return keywords.some((keyword) => normalized.includes(keyword));
}

/** Provedor simulado (Modo Demonstração / Fase 26) — casa palavras-chave da
 * pergunta com o contexto já resolvido (domain/ai/provider.ts::
 * AiProviderContext, montado por services/ai/aiContextService.ts a partir
 * dos módulos existentes) e devolve uma resposta em texto usando SOMENTE
 * dados reais já buscados. Nunca inventa números — se o contexto não tiver
 * o fato pedido, admite a limitação. Implementa a mesma interface que um
 * provedor real (OpenAI/Claude/Gemini) implementaria no futuro. */
export class SimulatedAiProvider implements AiProvider {
  readonly name = "simulado";

  async generateAnswer(input: AiGenerateAnswerInput): Promise<AiGenerateAnswerResult> {
    const { question, context, attempt } = input;

    if (
      context.knowledgeMatches.length > 0 &&
      matchesAny(question, ["como", "configurar", "o que é", "onde"])
    ) {
      const opener = pick(KNOWLEDGE_OPENERS, attempt);
      const docs = context.knowledgeMatches
        .slice(0, 3)
        .map((doc) => `• ${doc.title}${doc.summary ? ` — ${doc.summary}` : ""}`)
        .join("\n");
      return {
        content: `${opener} sobre "${question.trim()}":\n\n${docs}\n\nEsses documentos estão na Base de Conhecimento e podem ser abertos para o passo a passo completo.`,
      };
    }

    const opener = pick(GREETING_OPENERS, attempt);
    const facts = factsBlock(context);
    const closer = pick(GENERIC_CLOSERS, attempt);

    if (facts) {
      return {
        content: `${opener} de "${context.label}":\n\n${facts}\n\n${closer}`,
      };
    }

    return {
      content: `${opener}, ainda não encontrei dados suficientes para responder com precisão sobre "${question.trim()}". Tente perguntar sobre um lead, cliente, projeto específico ou sobre marketing, comercial, financeiro ou projetos.`,
    };
  }
}

let instance: SimulatedAiProvider | null = null;

export function getSimulatedAiProvider(): SimulatedAiProvider {
  if (!instance) instance = new SimulatedAiProvider();
  return instance;
}
