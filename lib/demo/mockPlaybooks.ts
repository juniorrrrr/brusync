import { buildPlaybookDashboardData } from "@/domain/playbooks/dashboard";
import type {
  PlaybookCategory,
  PlaybookDashboardData,
  PlaybookDetail,
  PlaybookHistoryEntry,
  PlaybookListFilters,
  PlaybookStatus,
  PlaybookStep,
  PlaybookSummary,
  PlaybooksPageData,
  PlaybookTemplate,
} from "@/types/playbooks";

function daysFromNow(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

const STAGES = [
  ["novo", "Novo lead"],
  ["primeiro_contato", "Primeiro contato"],
  ["diagnostico", "Diagnóstico"],
  ["reuniao", "Reunião"],
  ["proposta", "Proposta"],
  ["negociacao", "Negociação"],
  ["implantacao", "Implantação"],
  ["pos_venda", "Pós-venda"],
] as const;

const TEMPLATE_DEFS: { category: PlaybookCategory; name: string; objective: string }[] = [
  {
    category: "primeiro_contato",
    name: "Primeiro contato",
    objective: "Abrir conversa com contexto e próximo passo claro.",
  },
  {
    category: "diagnostico",
    name: "Diagnóstico",
    objective: "Entender dores, impacto, urgência e critérios de decisão.",
  },
  {
    category: "reuniao",
    name: "Reunião",
    objective: "Conduzir reunião comercial com agenda, descoberta e encaminhamento.",
  },
  {
    category: "proposta",
    name: "Proposta",
    objective: "Apresentar escopo, valor e condições com aderência ao diagnóstico.",
  },
  {
    category: "negociacao",
    name: "Negociação",
    objective: "Tratar objeções sem descaracterizar valor.",
  },
  {
    category: "follow_up",
    name: "Follow-up",
    objective: "Retomar oportunidades com utilidade e cadência saudável.",
  },
  {
    category: "implantacao",
    name: "Implantação",
    objective: "Guiar transição comercial para operação sem perda de contexto.",
  },
  {
    category: "pos_venda",
    name: "Pós-venda",
    objective: "Garantir adoção, satisfação e identificação de expansão.",
  },
  {
    category: "renovacao",
    name: "Renovação",
    objective: "Preparar renovação com evidência de resultado e plano futuro.",
  },
];

function stepBlueprint(
  title: string,
  position: number,
  category: PlaybookCategory,
): Omit<PlaybookStep, "id" | "playbookId" | "status" | "linkedDocuments"> {
  return {
    title,
    description: `Orientação operacional para ${title.toLowerCase()}.`,
    objective:
      "Executar a etapa com consistência, registrar aprendizados e avançar somente com evidências.",
    checklist: [
      "Confirmar contexto e objetivo da interação",
      "Registrar dor, impacto e próximo passo",
      "Validar responsável e prazo combinado",
    ],
    estimatedMinutes: 20 + position * 5,
    notes: "Use linguagem consultiva, objetiva e conectada ao estágio atual do lead.",
    links: [{ label: "Playbook interno", url: "/base-conhecimento/biblioteca" }],
    files: [],
    scripts: [
      `Abertura: "Quero entender se faz sentido avançarmos em ${title.toLowerCase()} com base no que vocês vivem hoje."`,
      'Fechamento: "Combinado, vou registrar este próximo passo e retorno com o material alinhado."',
    ],
    bestPractices: [
      "Conduzir a conversa com perguntas abertas",
      "Ancorar argumentos em evidências do diagnóstico",
      "Encerrar sempre com dono, prazo e critério de sucesso",
    ],
    commonMistakes: [
      "Enviar material sem conectar ao problema do lead",
      "Avançar etapa sem confirmar decisão ou influência",
    ],
    approvalCriteria: [
      "Checklist completo",
      "Próximo passo registrado",
      "Critério de avanço claro",
    ],
    rejectionCriteria: [
      "Sem dor identificada",
      "Sem responsável pelo próximo passo",
      "Informações críticas ausentes",
    ],
    suggestedActions:
      category === "follow_up"
        ? ["follow_up", "tarefa"]
        : category === "reuniao"
          ? ["reuniao", "tarefa"]
          : ["ligacao", "tarefa"],
    communicationChannels: ["whatsapp", "email", "conversa"],
    position,
  };
}

export const DEMO_PLAYBOOK_TEMPLATES: PlaybookTemplate[] = TEMPLATE_DEFS.map((item, index) => ({
  id: `tpl-playbook-${item.category}`,
  name: item.name,
  category: item.category,
  description: `Modelo padrão para ${item.name.toLowerCase()}.`,
  objective: item.objective,
  stepsBlueprint: [
    stepBlueprint("Preparação", 0, item.category),
    stepBlueprint("Condução", 1, item.category),
    stepBlueprint("Registro", 2, item.category),
    stepBlueprint("Próximo passo", 3, item.category),
  ],
  isDefault: true,
  createdAt: daysFromNow(-120 - index),
}));

const PLAYBOOK_DEFS: {
  name: string;
  category: PlaybookCategory;
  status: PlaybookStatus;
  executions: number;
  stage: (typeof STAGES)[number];
}[] = [
  {
    name: "Primeiro contato inbound",
    category: "primeiro_contato",
    status: "ativo",
    executions: 42,
    stage: STAGES[1],
  },
  {
    name: "Primeiro contato outbound consultivo",
    category: "primeiro_contato",
    status: "ativo",
    executions: 27,
    stage: STAGES[1],
  },
  {
    name: "Diagnóstico para software sob medida",
    category: "diagnostico",
    status: "ativo",
    executions: 38,
    stage: STAGES[2],
  },
  {
    name: "Diagnóstico executivo",
    category: "diagnostico",
    status: "em_revisao",
    executions: 18,
    stage: STAGES[2],
  },
  {
    name: "Reunião de alinhamento comercial",
    category: "reuniao",
    status: "ativo",
    executions: 31,
    stage: STAGES[3],
  },
  {
    name: "Proposta de transformação digital",
    category: "proposta",
    status: "ativo",
    executions: 24,
    stage: STAGES[4],
  },
  {
    name: "Negociação com múltiplos decisores",
    category: "negociacao",
    status: "ativo",
    executions: 19,
    stage: STAGES[5],
  },
  {
    name: "Follow-up sem resposta",
    category: "follow_up",
    status: "ativo",
    executions: 47,
    stage: STAGES[4],
  },
  {
    name: "Follow-up pós-proposta",
    category: "follow_up",
    status: "em_revisao",
    executions: 29,
    stage: STAGES[5],
  },
  {
    name: "Passagem para implantação",
    category: "implantacao",
    status: "ativo",
    executions: 16,
    stage: STAGES[6],
  },
  {
    name: "Pós-venda 30 dias",
    category: "pos_venda",
    status: "ativo",
    executions: 14,
    stage: STAGES[7],
  },
  {
    name: "Renovação anual consultiva",
    category: "renovacao",
    status: "rascunho",
    executions: 8,
    stage: STAGES[7],
  },
];

function buildSteps(playbookId: string, category: PlaybookCategory, index: number): PlaybookStep[] {
  const titles = [
    "Contexto do lead",
    "Hipótese de dor",
    "Perguntas obrigatórias",
    "Script principal",
    "Materiais de apoio",
    "Objeções esperadas",
  ];
  return titles.map((title, position) => ({
    ...stepBlueprint(title, position, category),
    id: `${playbookId}-step-${position + 1}`,
    playbookId,
    status: (position + index) % 4 === 0 ? "concluido" : "pendente",
    linkedDocuments:
      position === 4
        ? [
            {
              documentId: `demo-doc-${category}`,
              title: `Documento de apoio: ${title}`,
              categoryName: "Comercial",
            },
          ]
        : [],
  }));
}

const DETAILS: PlaybookDetail[] = PLAYBOOK_DEFS.map((def, index) => {
  const id = `playbook-${index + 1}`;
  const steps = buildSteps(id, def.category, index);
  const stage = def.stage;
  const averageStepMinutes = Math.round(
    steps.reduce((sum, step) => sum + (step.estimatedMinutes ?? 0), 0) / steps.length,
  );
  const history: PlaybookHistoryEntry[] = [
    {
      id: `${id}-hist-1`,
      playbookId: id,
      eventType: "playbook_atualizado",
      description: "Conteúdo revisado para demonstração comercial.",
      actorName: "Brusync Demo",
      createdAt: daysFromNow(-index - 1),
    },
  ];

  return {
    id,
    name: def.name,
    description: `Guia operacional para ${def.name.toLowerCase()}, com checklist, scripts e critérios de avanço.`,
    category: def.category,
    objective:
      DEMO_PLAYBOOK_TEMPLATES.find((template) => template.category === def.category)?.objective ??
      null,
    pipeline: "Comercial Brusync",
    pipelineStageId: stage[0],
    pipelineStageName: stage[1],
    ownerId: `owner-${(index % 3) + 1}`,
    ownerName: ["Ana Martins", "Bruno Costa", "Carla Souza"][index % 3],
    status: def.status,
    version: index % 3 === 0 ? 2 : 1,
    executionCount: def.executions,
    stepCount: steps.length,
    completedStepCount: steps.filter((step) => step.status === "concluido").length,
    pendingStepCount: steps.filter((step) => step.status === "pendente").length,
    averageStepMinutes,
    updatedAt: daysFromNow(-index),
    steps,
    history,
  };
});

function summary(detail: PlaybookDetail): PlaybookSummary {
  const { steps: _steps, history: _history, ...rest } = detail;
  return rest;
}

export function getDemoPlaybooksPageData(filters: PlaybookListFilters = {}): PlaybooksPageData {
  let playbooks = DETAILS.map(summary);
  if (filters.status) playbooks = playbooks.filter((item) => item.status === filters.status);
  if (filters.category) playbooks = playbooks.filter((item) => item.category === filters.category);
  if (filters.stageId)
    playbooks = playbooks.filter((item) => item.pipelineStageId === filters.stageId);
  if (filters.search) {
    const term = filters.search.toLowerCase();
    playbooks = playbooks.filter(
      (item) =>
        item.name.toLowerCase().includes(term) ||
        item.description?.toLowerCase().includes(term) ||
        item.pipelineStageName?.toLowerCase().includes(term),
    );
  }
  return { playbooks, total: playbooks.length };
}

export function getDemoPlaybookDashboardData(): PlaybookDashboardData {
  return buildPlaybookDashboardData(DETAILS.map(summary));
}

export function getDemoPlaybookTemplates(): PlaybookTemplate[] {
  return DEMO_PLAYBOOK_TEMPLATES;
}

export function getDemoPlaybookDetail(id: string): PlaybookDetail | null {
  return DETAILS.find((item) => item.id === id) ?? null;
}

export function getDemoPlaybookForStage(stageIdOrKey: string): PlaybookDetail | null {
  return (
    DETAILS.find((item) => item.pipelineStageId === stageIdOrKey) ??
    DETAILS.find((item) => item.category === "diagnostico") ??
    null
  );
}
