import { DEMO_LEADS, DEMO_OWNERS } from "@/lib/demo/mockSeed";
import type {
  AiConversation,
  AiConversationDetail,
  AiFeedback,
  AiMessage,
  AiPrompt,
  AiSuggestion,
} from "@/types/ai";

/** Fictitious dataset for "Modo Demonstração" — nunca gravado no Supabase.
 * Conversas/mensagens/prompts são fabricados aqui porque são o único dado
 * genuinamente novo desta fase (nenhum outro módulo tem "histórico de chat
 * com a IA"); as sugestões dos assistentes de Lead/Marketing/Comercial/
 * Financeiro/Projetos NÃO vêm daqui — são sempre recalculadas ao vivo por
 * domain/ai/insights/*.ts a partir dos mesmos datasets de demonstração que
 * os outros módulos já usam (DEMO_LEADS, mockFinancial, mockMarketing
 * etc.), garantindo que os números batam entre módulos. */

let seq = 0;
function demoId(prefix: string): string {
  seq += 1;
  return `00000000-ai00-4000-8000-${prefix}${String(seq).padStart(9, "0")}`;
}

const now = new Date();
function daysAgo(days: number): string {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
}

const FIRST_LEAD = DEMO_LEADS[0];
const SECOND_LEAD = DEMO_LEADS[7];

interface ConversationSeed {
  title: string;
  contextType: AiConversation["contextType"];
  contextRef: string | null;
  daysAgo: number;
  turns: { role: "user" | "assistant"; content: string }[];
}

const CONVERSATION_SEEDS: ConversationSeed[] = [
  {
    title: "Panorama geral do CRM",
    contextType: "geral",
    contextRef: null,
    daysAgo: 0,
    turns: [
      { role: "user", content: "Como está a operação hoje?" },
      {
        role: "assistant",
        content:
          "Olá! Analisando os dados disponíveis de Geral:\n\n• Leads cadastrados: 27\n• Projetos cadastrados: 12\n• Receita do mês: 58500.00\n\nPosso detalhar algum desses pontos.",
      },
    ],
  },
  {
    title: `Resumo do lead ${FIRST_LEAD.name}`,
    contextType: "lead",
    contextRef: FIRST_LEAD.id,
    daysAgo: 1,
    turns: [
      { role: "user", content: "Me dá um resumo desse lead?" },
      {
        role: "assistant",
        content: `Olá! Analisando os dados disponíveis de ${FIRST_LEAD.name}:\n\n• Etapa: Novo\n• Score: ${FIRST_LEAD.score}\n• Responsável: sem responsável\n\nPosso detalhar algum desses pontos.`,
      },
      { role: "user", content: "Qual a próxima ação recomendada?" },
      {
        role: "assistant",
        content: "Fazer contato agora — nenhuma interação foi registrada ainda.",
      },
    ],
  },
  {
    title: "Campanhas de marketing",
    contextType: "marketing",
    contextRef: null,
    daysAgo: 2,
    turns: [
      { role: "user", content: "Quais campanhas estão performando mal?" },
      {
        role: "assistant",
        content:
          "Oi! Com base nas informações que já temos no sistema de Marketing:\n\n• Campanhas monitoradas: 6\n• CAC médio: 480.00\n• ROAS médio: 3.20x\n\nQuer que eu aprofunde em algum item específico?",
      },
    ],
  },
  {
    title: "Leads esquecidos",
    contextType: "comercial",
    contextRef: null,
    daysAgo: 3,
    turns: [
      { role: "user", content: "Tem lead esquecido no funil?" },
      {
        role: "assistant",
        content:
          "Certo, olhando o que temos registrado de Comercial:\n\n• Leads em aberto: 21\n\nPosso detalhar algum desses pontos.",
      },
    ],
  },
  {
    title: "Situação financeira do mês",
    contextType: "financeiro",
    contextRef: null,
    daysAgo: 4,
    turns: [
      { role: "user", content: "Como está o fluxo de caixa?" },
      {
        role: "assistant",
        content:
          "Olá! Analisando os dados disponíveis de Financeiro:\n\n• Fluxo de caixa do mês: 18400.00\n• Parcelas vencidas: 3\n\nPosso detalhar algum desses pontos.",
      },
    ],
  },
  {
    title: "Projetos em risco",
    contextType: "projetos",
    contextRef: null,
    daysAgo: 5,
    turns: [
      { role: "user", content: "Algum projeto atrasado essa semana?" },
      {
        role: "assistant",
        content:
          "Oi! Com base nas informações que já temos no sistema de Projetos:\n\n• Projetos ativos: 9\n\nQuer que eu aprofunde em algum item específico?",
      },
    ],
  },
  {
    title: `Follow-up de ${SECOND_LEAD?.name ?? "lead"}`,
    contextType: "lead",
    contextRef: SECOND_LEAD?.id ?? FIRST_LEAD.id,
    daysAgo: 6,
    turns: [
      { role: "user", content: "Esse lead tem risco de perder?" },
      {
        role: "assistant",
        content:
          "Certo, olhando o que temos registrado sobre riscos:\n\n• parado acima da média de dias na etapa atual\n\nPosso detalhar algum desses pontos.",
      },
    ],
  },
  {
    title: "Como configurar Meta Ads?",
    contextType: "geral",
    contextRef: null,
    daysAgo: 7,
    turns: [
      { role: "user", content: "Como configurar Meta Ads?" },
      {
        role: "assistant",
        content:
          'Encontrei o seguinte na Base de Conhecimento sobre "Como configurar Meta Ads?":\n\n• Configuração do Meta Ads — passo a passo de integração da conta de anúncios\n\nEsses documentos estão na Base de Conhecimento e podem ser abertos para o passo a passo completo.',
      },
    ],
  },
];

const DEMO_CONVERSATIONS: AiConversationDetail[] = CONVERSATION_SEEDS.map((seed) => {
  const conversationId = demoId("conv");
  const createdAt = daysAgo(seed.daysAgo);
  const messages: AiMessage[] = seed.turns.map((turn, index) => ({
    id: demoId("msg"),
    conversationId,
    role: turn.role,
    content: turn.content,
    isFavorite: index === seed.turns.length - 1 && seed.daysAgo <= 2,
    createdAt: daysAgo(seed.daysAgo - index * 0.01),
  }));

  return {
    id: conversationId,
    title: seed.title,
    contextType: seed.contextType,
    contextRef: seed.contextRef,
    status: "ativa",
    createdBy: DEMO_OWNERS[seed.daysAgo % DEMO_OWNERS.length].id,
    createdAt,
    updatedAt: messages[messages.length - 1]?.createdAt ?? createdAt,
    messages,
  };
});

export function getDemoAiConversations(): AiConversation[] {
  return DEMO_CONVERSATIONS.map(({ messages: _messages, ...conversation }) => conversation).sort(
    (a, b) => (a.updatedAt < b.updatedAt ? 1 : -1),
  );
}

export function getDemoAiConversationDetail(id: string): AiConversationDetail | null {
  return DEMO_CONVERSATIONS.find((c) => c.id === id) ?? null;
}

export function getDemoAiAllMessages(): AiMessage[] {
  return DEMO_CONVERSATIONS.flatMap((c) => c.messages);
}

export function getDemoAiRecentQuestions(limit = 10): AiMessage[] {
  return getDemoAiAllMessages()
    .filter((m) => m.role === "user")
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, limit);
}

export function getDemoAiFavoriteMessages(): AiMessage[] {
  return getDemoAiAllMessages().filter((m) => m.isFavorite);
}

const PROMPT_SEEDS: { title: string; content: string; category: string }[] = [
  { title: "Resumo do dia", content: "Como está a operação hoje?", category: "Geral" },
  { title: "Leads esquecidos", content: "Tem lead esquecido no funil?", category: "Comercial" },
  {
    title: "Pipeline parado",
    content: "Quais leads estão parados acima do tempo médio da etapa?",
    category: "Comercial",
  },
  {
    title: "Campanhas fracas",
    content: "Quais campanhas estão performando mal?",
    category: "Marketing",
  },
  {
    title: "CAC alto",
    content: "Alguma campanha está com CAC acima da média?",
    category: "Marketing",
  },
  {
    title: "Fluxo de caixa",
    content: "Como está o fluxo de caixa do mês?",
    category: "Financeiro",
  },
  {
    title: "Inadimplência",
    content: "Quais clientes estão inadimplentes?",
    category: "Financeiro",
  },
  {
    title: "Projetos atrasados",
    content: "Algum projeto atrasado essa semana?",
    category: "Projetos",
  },
  {
    title: "Carga da equipe",
    content: "Como está distribuída a carga de projetos da equipe?",
    category: "Projetos",
  },
  {
    title: "Como configurar Meta Ads?",
    content: "Como configurar Meta Ads?",
    category: "Base de Conhecimento",
  },
];

const DEMO_PROMPTS: AiPrompt[] = PROMPT_SEEDS.map((seed, index) => ({
  id: demoId("prompt"),
  title: seed.title,
  content: seed.content,
  category: seed.category,
  createdBy: DEMO_OWNERS[index % DEMO_OWNERS.length].id,
  createdAt: daysAgo(20 - index),
}));

export function getDemoAiPrompts(): AiPrompt[] {
  return DEMO_PROMPTS;
}

const SUGGESTION_LOG_SEEDS: {
  type: AiSuggestion["type"];
  module: AiSuggestion["module"];
  title: string;
  content: string;
  severity: AiSuggestion["severity"];
  daysAgo: number;
}[] = [
  {
    type: "lead_esquecido",
    module: "comercial",
    title: "Leads esquecidos",
    content: `${DEMO_LEADS[2].name} está há mais de 10 dias sem contato.`,
    severity: "critico",
    daysAgo: 0,
  },
  {
    type: "campanha_baixo_desempenho",
    module: "marketing",
    title: "Campanha com baixo desempenho",
    content: "A campanha tiktok-ads-pmes está com ROAS abaixo de 1x.",
    severity: "atencao",
    daysAgo: 0,
  },
  {
    type: "cliente_inadimplente",
    module: "financeiro",
    title: "Cliente inadimplente",
    content: "Construtora Horizonte tem parcelas vencidas.",
    severity: "critico",
    daysAgo: 1,
  },
  {
    type: "projeto_atrasado",
    module: "projetos",
    title: "Projeto atrasado",
    content: "Um projeto está com o prazo vencido há 4 dias.",
    severity: "atencao",
    daysAgo: 1,
  },
  {
    type: "resumo",
    module: "lead",
    title: "Resumo automático do lead",
    content: `${FIRST_LEAD.name} está na etapa Novo com score ${FIRST_LEAD.score}.`,
    severity: "info",
    daysAgo: 2,
  },
  {
    type: "proxima_acao",
    module: "lead",
    title: "Próxima melhor ação",
    content: "Fazer contato agora — nenhuma interação registrada.",
    severity: "atencao",
    daysAgo: 2,
  },
  {
    type: "pipeline_parado",
    module: "comercial",
    title: "Pipeline parado",
    content: "3 leads parados acima do tempo médio da etapa.",
    severity: "atencao",
    daysAgo: 3,
  },
  {
    type: "roas_baixo",
    module: "marketing",
    title: "ROAS abaixo do esperado",
    content: "Campanha reels-transformacao-digital com ROAS abaixo da média geral.",
    severity: "atencao",
    daysAgo: 3,
  },
  {
    type: "fluxo_caixa",
    module: "financeiro",
    title: "Fluxo de caixa",
    content: "Fluxo de caixa do mês positivo em R$ 18.400,00.",
    severity: "info",
    daysAgo: 4,
  },
  {
    type: "carga_equipe",
    module: "projetos",
    title: "Carga da equipe",
    content: "Rafael Souza é o colaborador com mais projetos ativos.",
    severity: "info",
    daysAgo: 4,
  },
  {
    type: "oportunidade",
    module: "comercial",
    title: "Próxima oportunidade",
    content: "Marcos Vinícius Silveira está em Proposta com score 78.",
    severity: "info",
    daysAgo: 5,
  },
  {
    type: "risco",
    module: "lead",
    title: "Risco encontrado",
    content: "Lead sem contato há mais de uma semana.",
    severity: "atencao",
    daysAgo: 5,
  },
  {
    type: "receita_em_risco",
    module: "financeiro",
    title: "Receita em risco",
    content: "2 recebimentos vencidos acima do ticket médio.",
    severity: "critico",
    daysAgo: 6,
  },
  {
    type: "projeto_sem_responsavel",
    module: "projetos",
    title: "Projeto sem responsável",
    content: "1 projeto ativo ainda não tem responsável definido.",
    severity: "atencao",
    daysAgo: 6,
  },
  {
    type: "cac_alto",
    module: "marketing",
    title: "CAC acima da média",
    content: "Campanha linkedin-b2b-decisores com CAC acima de 1,3x a média.",
    severity: "atencao",
    daysAgo: 7,
  },
];

const DEMO_SUGGESTIONS_LOG: AiSuggestion[] = SUGGESTION_LOG_SEEDS.map((seed) => ({
  id: demoId("sug"),
  type: seed.type,
  module: seed.module,
  contextRef: null,
  title: seed.title,
  content: seed.content,
  severity: seed.severity,
  evidence: [],
  isFavorite: false,
  createdAt: daysAgo(seed.daysAgo),
}));

export function getDemoAiSuggestionsLog(): AiSuggestion[] {
  return DEMO_SUGGESTIONS_LOG;
}

const DEMO_FEEDBACK: AiFeedback[] = Array.from({ length: 12 }, (_, i) => ({
  id: demoId("fb"),
  targetType: i % 2 === 0 ? "message" : "suggestion",
  targetId:
    i % 2 === 0
      ? (DEMO_CONVERSATIONS[i % DEMO_CONVERSATIONS.length]?.messages[0]?.id ?? "")
      : (DEMO_SUGGESTIONS_LOG[i % DEMO_SUGGESTIONS_LOG.length]?.id ?? ""),
  rating: i % 5 === 0 ? "negativo" : "positivo",
  comment: null,
  createdBy: DEMO_OWNERS[i % DEMO_OWNERS.length].id,
  createdAt: daysAgo(i),
}));

export function getDemoAiFeedback(): AiFeedback[] {
  return DEMO_FEEDBACK;
}

export function getDemoAiUsageCountLast30Days(): number {
  return (
    DEMO_CONVERSATIONS.reduce(
      (sum, c) => sum + c.messages.filter((m) => m.role === "user").length,
      0,
    ) + DEMO_SUGGESTIONS_LOG.length
  );
}
