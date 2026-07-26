import { buildProcessDashboardData } from "@/domain/processes/dashboard";
import {
  computeChecklistProgress,
  computeExecutedMinutes,
  computeProcessProgressPercent,
  computeStepProgressPercent,
} from "@/domain/processes/progress";
import { getDemoProjects } from "@/lib/demo/mockProjects";
import { DEMO_LEADS, DEMO_OWNERS, DEMO_STANDALONE_CLIENTS } from "@/lib/demo/mockSeed";
import type {
  ProcessApproval,
  ProcessCategory,
  ProcessCategoryColor,
  ProcessChecklistItem,
  ProcessChecklistItemStatus,
  ProcessDashboardData,
  ProcessDetail,
  ProcessDocumentLink,
  ProcessesPageData,
  ProcessFilterOptions,
  ProcessHistoryEntry,
  ProcessListFilters,
  ProcessStatus,
  ProcessStep,
  ProcessStepStatus,
  ProcessSummary,
  ProcessTemplate,
} from "@/types/processes";

function daysFromNow(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

// ----------------------------------------------------------------------------
// Categorias — mesmos 10 slugs/ícones/cores semeados pela migration da Fase
// 24, num universo paralelo de IDs (nenhuma chamada ao banco em Modo
// Demonstração).
// ----------------------------------------------------------------------------
const CATEGORY_DEFS: { name: string; slug: string; icon: string; color: ProcessCategoryColor }[] = [
  { name: "Comercial", slug: "comercial", icon: "target", color: "info" },
  { name: "Atendimento", slug: "atendimento", icon: "message", color: "info" },
  { name: "Onboarding", slug: "onboarding", icon: "check-circle", color: "ok" },
  { name: "Financeiro", slug: "financeiro", icon: "wallet", color: "ok" },
  { name: "Projetos", slug: "projetos", icon: "doc", color: "info" },
  { name: "Marketing", slug: "marketing", icon: "report", color: "warn" },
  { name: "RH", slug: "rh", icon: "users", color: "neutral" },
  { name: "Operacional", slug: "operacional", icon: "bolt", color: "neutral" },
  { name: "Qualidade", slug: "qualidade", icon: "tag", color: "warn" },
  { name: "TI", slug: "ti", icon: "server", color: "neutral" },
];

const DEMO_CATEGORIES: ProcessCategory[] = CATEGORY_DEFS.map((def, index) => ({
  id: `cat-${def.slug}`,
  name: def.name,
  slug: def.slug,
  description: null,
  icon: def.icon,
  color: def.color,
  isDefault: true,
  sortOrder: index + 1,
  processCount: 0,
  createdAt: daysFromNow(-365),
}));

function categoryBySlug(slug: string): ProcessCategory {
  const category = DEMO_CATEGORIES.find((c) => c.slug === slug);
  if (!category) throw new Error(`Categoria demo desconhecida: ${slug}`);
  return category;
}

// ----------------------------------------------------------------------------
// Templates — a "receita" de etapas+checklist copiada ao instanciar um
// processo real a partir de um modelo.
// ----------------------------------------------------------------------------
const DEMO_TEMPLATES: ProcessTemplate[] = [
  {
    id: "tpl-onboarding-cliente",
    name: "Onboarding de Cliente",
    description: "Passos padrão para receber e configurar um novo cliente.",
    categoryId: "cat-onboarding",
    categoryName: "Onboarding",
    categoryColor: "ok",
    defaultEstimatedMinutes: 480,
    isDefault: true,
    createdAt: daysFromNow(-300),
    stepsBlueprint: [
      {
        name: "Boas-vindas e apresentação",
        description: null,
        position: 0,
        checklist: [
          { label: "Enviar e-mail de boas-vindas", position: 0 },
          { label: "Agendar reunião de kickoff", position: 1 },
        ],
      },
      {
        name: "Configuração inicial",
        description: null,
        position: 1,
        checklist: [
          { label: "Criar acesso ao sistema", position: 0 },
          { label: "Importar dados iniciais", position: 1 },
        ],
      },
      {
        name: "Treinamento",
        description: null,
        position: 2,
        checklist: [
          { label: "Sessão de treinamento realizada", position: 0 },
          { label: "Material de apoio enviado", position: 1 },
        ],
      },
    ],
  },
  {
    id: "tpl-qualificacao-lead",
    name: "Qualificação de Lead",
    description: "Roteiro de descoberta e validação BANT de um lead novo.",
    categoryId: "cat-comercial",
    categoryName: "Comercial",
    categoryColor: "info",
    defaultEstimatedMinutes: 90,
    isDefault: true,
    createdAt: daysFromNow(-300),
    stepsBlueprint: [
      {
        name: "Levantamento de necessidades",
        description: null,
        position: 0,
        checklist: [
          { label: "Identificar dor principal", position: 0 },
          { label: "Confirmar orçamento disponível", position: 1 },
        ],
      },
      {
        name: "Validação BANT",
        description: null,
        position: 1,
        checklist: [
          { label: "Budget confirmado", position: 0 },
          { label: "Authority confirmado", position: 1 },
          { label: "Need confirmado", position: 2 },
          { label: "Timeline confirmado", position: 3 },
        ],
      },
    ],
  },
  {
    id: "tpl-fechamento-projeto",
    name: "Fechamento de Projeto",
    description: "Homologação, entrega e encerramento formal de um projeto.",
    categoryId: "cat-projetos",
    categoryName: "Projetos",
    categoryColor: "info",
    defaultEstimatedMinutes: 360,
    isDefault: true,
    createdAt: daysFromNow(-300),
    stepsBlueprint: [
      {
        name: "Homologação",
        description: null,
        position: 0,
        checklist: [{ label: "Testes finais aprovados pelo cliente", position: 0 }],
      },
      {
        name: "Entrega",
        description: null,
        position: 1,
        checklist: [
          { label: "Treinamento da equipe do cliente", position: 0 },
          { label: "Documentação entregue", position: 1 },
        ],
      },
      {
        name: "Encerramento",
        description: null,
        position: 2,
        checklist: [
          { label: "Feedback coletado", position: 0 },
          { label: "Contrato encerrado", position: 1 },
        ],
      },
    ],
  },
  {
    id: "tpl-atendimento-chamado",
    name: "Atendimento de Chamado",
    description: "Triagem, resolução e fechamento de um chamado de suporte.",
    categoryId: "cat-atendimento",
    categoryName: "Atendimento",
    categoryColor: "info",
    defaultEstimatedMinutes: 60,
    isDefault: true,
    createdAt: daysFromNow(-300),
    stepsBlueprint: [
      {
        name: "Triagem",
        description: null,
        position: 0,
        checklist: [
          { label: "Categorizar chamado", position: 0 },
          { label: "Definir prioridade", position: 1 },
        ],
      },
      {
        name: "Resolução",
        description: null,
        position: 1,
        checklist: [
          { label: "Solução aplicada", position: 0 },
          { label: "Cliente notificado", position: 1 },
        ],
      },
      {
        name: "Fechamento",
        description: null,
        position: 2,
        checklist: [{ label: "Chamado encerrado no sistema", position: 0 }],
      },
    ],
  },
  {
    id: "tpl-contratacao",
    name: "Contratação",
    description: "Do currículo à proposta aceita.",
    categoryId: "cat-rh",
    categoryName: "RH",
    categoryColor: "neutral",
    defaultEstimatedMinutes: 720,
    isDefault: true,
    createdAt: daysFromNow(-300),
    stepsBlueprint: [
      {
        name: "Triagem de currículos",
        description: null,
        position: 0,
        checklist: [
          { label: "Currículos avaliados", position: 0 },
          { label: "Entrevistas agendadas", position: 1 },
        ],
      },
      {
        name: "Entrevistas",
        description: null,
        position: 1,
        checklist: [
          { label: "Entrevista técnica realizada", position: 0 },
          { label: "Entrevista cultural realizada", position: 1 },
        ],
      },
      {
        name: "Proposta",
        description: null,
        position: 2,
        checklist: [
          { label: "Proposta enviada", position: 0 },
          { label: "Proposta aceita", position: 1 },
        ],
      },
    ],
  },
];

// ----------------------------------------------------------------------------
// Processos — ~15 fictícios, distribuídos entre categorias e status.
// ----------------------------------------------------------------------------
interface DemoStepDef {
  name: string;
  checklist: string[];
}

interface DemoProcessDef {
  id: string;
  name: string;
  description: string;
  categorySlug: string;
  ownerIndex: number | null;
  status: ProcessStatus;
  startedDaysAgo: number | null;
  completedDaysAgo: number | null;
  estimatedMinutes: number;
  /** -1 = nada iniciado ainda (rascunho). */
  currentStepIndex: number;
  steps: DemoStepDef[];
  templateId?: string;
  clientId?: string;
  clientCompany?: string;
  projectId?: string;
  projectName?: string;
  crmLeadId?: string;
  crmLeadName?: string;
  needsApproval?: boolean;
  resolvedApproval?: "aprovado" | "reprovado";
  documentTitle?: string;
  documentCategoryName?: string;
}

const [demoProject0, demoProject1, demoProject2] = getDemoProjects({ limit: 3 }).projects;

const DEMO_PROCESS_DEFS: DemoProcessDef[] = [
  {
    id: "proc-qualificacao-lead-inbound",
    name: "Qualificação de Lead Inbound",
    description: "Descoberta e validação BANT de leads recebidos pelo site.",
    categorySlug: "comercial",
    ownerIndex: 0,
    status: "ativo",
    startedDaysAgo: 3,
    completedDaysAgo: null,
    estimatedMinutes: 90,
    currentStepIndex: 0,
    templateId: "tpl-qualificacao-lead",
    crmLeadId: DEMO_LEADS[0]?.id,
    crmLeadName: DEMO_LEADS[0]?.name,
    steps: [
      {
        name: "Levantamento de necessidades",
        checklist: ["Identificar dor principal", "Confirmar orçamento disponível"],
      },
      {
        name: "Validação BANT",
        checklist: [
          "Budget confirmado",
          "Authority confirmado",
          "Need confirmado",
          "Timeline confirmado",
        ],
      },
    ],
  },
  {
    id: "proc-envio-proposta-comercial",
    name: "Envio de Proposta Comercial",
    description: "Elaboração e envio de proposta para lead qualificado.",
    categorySlug: "comercial",
    ownerIndex: 1,
    status: "ativo",
    startedDaysAgo: 5,
    completedDaysAgo: null,
    estimatedMinutes: 120,
    currentStepIndex: 1,
    crmLeadId: DEMO_LEADS[1]?.id,
    crmLeadName: DEMO_LEADS[1]?.name,
    documentTitle: "Proposta Comercial",
    documentCategoryName: "Comercial",
    steps: [
      {
        name: "Elaboração da proposta",
        checklist: ["Escopo definido", "Valores aprovados internamente"],
      },
      {
        name: "Envio e acompanhamento",
        checklist: ["Proposta enviada ao cliente", "Follow-up agendado"],
      },
    ],
  },
  {
    id: "proc-abertura-chamado-suporte",
    name: "Abertura de Chamado de Suporte",
    description: "Registro e encaminhamento inicial de um chamado.",
    categorySlug: "atendimento",
    ownerIndex: 2,
    status: "concluido",
    startedDaysAgo: 10,
    completedDaysAgo: 9,
    estimatedMinutes: 30,
    currentStepIndex: 1,
    templateId: "tpl-atendimento-chamado",
    steps: [
      { name: "Triagem", checklist: ["Categorizar chamado", "Definir prioridade"] },
      { name: "Encaminhamento", checklist: ["Chamado encaminhado à equipe responsável"] },
    ],
  },
  {
    id: "proc-resolucao-reclamacao-cliente",
    name: "Resolução de Reclamação de Cliente",
    description: "Tratativa de reclamação com aprovação de gestor antes do encerramento.",
    categorySlug: "atendimento",
    ownerIndex: 3,
    status: "aguardando_aprovacao",
    startedDaysAgo: 4,
    completedDaysAgo: null,
    estimatedMinutes: 120,
    currentStepIndex: 1,
    needsApproval: true,
    clientId: DEMO_STANDALONE_CLIENTS[2]?.id,
    clientCompany: DEMO_STANDALONE_CLIENTS[2]?.company,
    steps: [
      {
        name: "Levantamento do ocorrido",
        checklist: ["Reclamação registrada", "Cliente contatado"],
      },
      {
        name: "Proposta de solução",
        checklist: ["Solução definida", "Aprovação do gestor solicitada"],
      },
    ],
  },
  {
    id: "proc-onboarding-novo-cliente",
    name: "Onboarding de Novo Cliente",
    description: "Recepção e configuração inicial de um cliente fechado.",
    categorySlug: "onboarding",
    ownerIndex: 0,
    status: "ativo",
    startedDaysAgo: 7,
    completedDaysAgo: null,
    estimatedMinutes: 480,
    currentStepIndex: 1,
    templateId: "tpl-onboarding-cliente",
    clientId: DEMO_STANDALONE_CLIENTS[0]?.id,
    clientCompany: DEMO_STANDALONE_CLIENTS[0]?.company,
    documentTitle: "Manual do CRM",
    documentCategoryName: "Tecnologia",
    steps: [
      {
        name: "Boas-vindas e apresentação",
        checklist: ["Enviar e-mail de boas-vindas", "Agendar reunião de kickoff"],
      },
      {
        name: "Configuração inicial",
        checklist: ["Criar acesso ao sistema", "Importar dados iniciais"],
      },
      {
        name: "Treinamento",
        checklist: ["Sessão de treinamento realizada", "Material de apoio enviado"],
      },
    ],
  },
  {
    id: "proc-kickoff-projeto",
    name: "Kickoff de Projeto",
    description: "Reunião inicial e alinhamento de escopo com o cliente.",
    categorySlug: "onboarding",
    ownerIndex: 1,
    status: "rascunho",
    startedDaysAgo: null,
    completedDaysAgo: null,
    estimatedMinutes: 60,
    currentStepIndex: -1,
    projectId: demoProject0?.id,
    projectName: demoProject0?.name,
    steps: [
      { name: "Preparação", checklist: ["Pauta da reunião definida", "Convite enviado"] },
      { name: "Reunião de kickoff", checklist: ["Reunião realizada", "Ata compartilhada"] },
    ],
  },
  {
    id: "proc-emissao-nota-fiscal",
    name: "Emissão de Nota Fiscal",
    description: "Emissão e envio de nota fiscal referente a um contrato fechado.",
    categorySlug: "financeiro",
    ownerIndex: 2,
    status: "concluido",
    startedDaysAgo: 15,
    completedDaysAgo: 14,
    estimatedMinutes: 30,
    currentStepIndex: 1,
    resolvedApproval: "aprovado",
    steps: [
      { name: "Conferência de valores", checklist: ["Valores conferidos com o financeiro"] },
      { name: "Emissão e envio", checklist: ["Nota fiscal emitida", "Nota enviada ao cliente"] },
    ],
  },
  {
    id: "proc-cobranca-inadimplencia",
    name: "Cobrança de Inadimplência",
    description: "Régua de cobrança para parcelas em atraso.",
    categorySlug: "financeiro",
    ownerIndex: 3,
    status: "pausado",
    startedDaysAgo: 20,
    completedDaysAgo: null,
    estimatedMinutes: 90,
    currentStepIndex: 0,
    clientId: DEMO_STANDALONE_CLIENTS[2]?.id,
    clientCompany: DEMO_STANDALONE_CLIENTS[2]?.company,
    steps: [
      { name: "Primeiro contato", checklist: ["Cliente notificado", "Negociação proposta"] },
      { name: "Escalonamento", checklist: ["Financeiro acionado", "Acordo registrado"] },
    ],
  },
  {
    id: "proc-entrega-projeto-software",
    name: "Entrega de Projeto de Software",
    description: "Fluxo de homologação e entrega final de um projeto.",
    categorySlug: "projetos",
    ownerIndex: 0,
    status: "ativo",
    startedDaysAgo: 12,
    completedDaysAgo: null,
    estimatedMinutes: 360,
    currentStepIndex: 0,
    templateId: "tpl-fechamento-projeto",
    projectId: demoProject1?.id,
    projectName: demoProject1?.name,
    steps: [
      { name: "Homologação", checklist: ["Testes finais aprovados pelo cliente"] },
      { name: "Entrega", checklist: ["Treinamento da equipe do cliente", "Documentação entregue"] },
      { name: "Encerramento", checklist: ["Feedback coletado", "Contrato encerrado"] },
    ],
  },
  {
    id: "proc-homologacao-cliente",
    name: "Homologação com Cliente",
    description: "Validação final de entregáveis antes do encerramento do projeto.",
    categorySlug: "projetos",
    ownerIndex: 1,
    status: "aguardando_aprovacao",
    startedDaysAgo: 6,
    completedDaysAgo: null,
    estimatedMinutes: 180,
    currentStepIndex: 0,
    needsApproval: true,
    projectId: demoProject2?.id,
    projectName: demoProject2?.name,
    clientId: DEMO_STANDALONE_CLIENTS[1]?.id,
    clientCompany: DEMO_STANDALONE_CLIENTS[1]?.company,
    steps: [
      {
        name: "Testes de homologação",
        checklist: ["Roteiro de testes executado", "Aprovação do cliente solicitada"],
      },
    ],
  },
  {
    id: "proc-publicacao-campanha",
    name: "Publicação de Campanha",
    description: "Checklist de publicação de uma nova campanha de marketing.",
    categorySlug: "marketing",
    ownerIndex: 2,
    status: "concluido",
    startedDaysAgo: 8,
    completedDaysAgo: 6,
    estimatedMinutes: 120,
    currentStepIndex: 1,
    steps: [
      { name: "Preparação de criativos", checklist: ["Criativos aprovados", "Textos revisados"] },
      { name: "Publicação", checklist: ["Campanha publicada", "UTMs configuradas"] },
    ],
  },
  {
    id: "proc-criacao-landing-page",
    name: "Criação de Landing Page",
    description: "Desenvolvimento de landing page para uma campanha específica.",
    categorySlug: "marketing",
    ownerIndex: 3,
    status: "ativo",
    startedDaysAgo: 2,
    completedDaysAgo: null,
    estimatedMinutes: 240,
    currentStepIndex: 0,
    steps: [
      { name: "Design", checklist: ["Wireframe aprovado", "Layout final aprovado"] },
      { name: "Publicação", checklist: ["Página publicada", "Testes de formulário realizados"] },
    ],
  },
  {
    id: "proc-contratacao-colaborador",
    name: "Contratação de Novo Colaborador",
    description: "Processo seletivo para uma vaga em aberto.",
    categorySlug: "rh",
    ownerIndex: null,
    status: "rascunho",
    startedDaysAgo: null,
    completedDaysAgo: null,
    estimatedMinutes: 720,
    currentStepIndex: -1,
    templateId: "tpl-contratacao",
    steps: [
      {
        name: "Triagem de currículos",
        checklist: ["Currículos avaliados", "Entrevistas agendadas"],
      },
      {
        name: "Entrevistas",
        checklist: ["Entrevista técnica realizada", "Entrevista cultural realizada"],
      },
      { name: "Proposta", checklist: ["Proposta enviada", "Proposta aceita"] },
    ],
  },
  {
    id: "proc-backup-rotina-seguranca",
    name: "Backup e Rotina de Segurança",
    description: "Checklist mensal de backup e verificação de segurança.",
    categorySlug: "operacional",
    ownerIndex: 0,
    status: "arquivado",
    startedDaysAgo: 60,
    completedDaysAgo: 55,
    estimatedMinutes: 60,
    currentStepIndex: 1,
    steps: [
      { name: "Backup", checklist: ["Backup executado", "Backup validado"] },
      { name: "Segurança", checklist: ["Acessos revisados", "Relatório arquivado"] },
    ],
  },
  {
    id: "proc-provisionamento-ambiente",
    name: "Provisionamento de Ambiente de Cliente",
    description: "Criação do ambiente técnico dedicado a um novo cliente.",
    categorySlug: "ti",
    ownerIndex: 1,
    status: "pausado",
    startedDaysAgo: 9,
    completedDaysAgo: null,
    estimatedMinutes: 180,
    currentStepIndex: 0,
    clientId: DEMO_STANDALONE_CLIENTS[3]?.id,
    clientCompany: DEMO_STANDALONE_CLIENTS[3]?.company,
    steps: [
      { name: "Provisionamento", checklist: ["Servidor provisionado", "Domínio configurado"] },
      { name: "Validação", checklist: ["Testes de acesso realizados"] },
    ],
  },
];

function buildSteps(def: DemoProcessDef, startedAt: string | null): ProcessStep[] {
  const forceDone = def.status === "concluido" || def.status === "arquivado";
  const forceNothing = def.status === "rascunho";

  return def.steps.map((stepDef, stepIndex): ProcessStep => {
    const stepId = `${def.id}-step-${stepIndex}`;
    let stepStatus: ProcessStepStatus;
    if (forceDone) stepStatus = "concluido";
    else if (forceNothing) stepStatus = "pendente";
    else if (stepIndex < def.currentStepIndex) stepStatus = "concluido";
    else if (stepIndex === def.currentStepIndex) stepStatus = "em_andamento";
    else stepStatus = "pendente";

    const checklistItems: ProcessChecklistItem[] = stepDef.checklist.map((label, itemIndex) => {
      let itemStatus: ProcessChecklistItemStatus;
      if (stepStatus === "concluido") itemStatus = "concluido";
      else if (stepStatus === "em_andamento") {
        itemStatus = itemIndex < Math.ceil(stepDef.checklist.length / 2) ? "concluido" : "pendente";
      } else itemStatus = "pendente";

      return {
        id: `${stepId}-item-${itemIndex}`,
        processId: def.id,
        stepId,
        label,
        position: itemIndex,
        status: itemStatus,
        completedAt: itemStatus === "concluido" ? startedAt : null,
        completedByName:
          itemStatus === "concluido" && def.ownerIndex !== null
            ? DEMO_OWNERS[def.ownerIndex].name
            : null,
        createdAt: startedAt ?? daysFromNow(-1),
      };
    });

    return {
      id: stepId,
      processId: def.id,
      name: stepDef.name,
      description: null,
      position: stepIndex,
      status: stepStatus,
      startedAt: stepStatus !== "pendente" ? startedAt : null,
      completedAt: stepStatus === "concluido" ? startedAt : null,
      checklistItems,
      progressPercent: computeStepProgressPercent({ status: stepStatus, checklistItems }),
    };
  });
}

function buildApprovals(
  def: DemoProcessDef,
  owner: { id: string; name: string | null } | null,
): ProcessApproval[] {
  const approvals: ProcessApproval[] = [];

  if (def.needsApproval) {
    approvals.push({
      id: `${def.id}-approval-0`,
      processId: def.id,
      stepId: null,
      stepName: null,
      status: "pendente",
      notes: null,
      decidedAt: null,
      requestedById: owner?.id ?? null,
      requestedByName: owner?.name ?? null,
      approverId: null,
      approverName: null,
      createdAt: daysFromNow(-1),
    });
  }

  if (def.resolvedApproval) {
    const approver = DEMO_OWNERS[0];
    approvals.push({
      id: `${def.id}-approval-0`,
      processId: def.id,
      stepId: null,
      stepName: null,
      status: def.resolvedApproval,
      notes: null,
      decidedAt: daysFromNow(-(def.completedDaysAgo ?? 1)),
      requestedById: owner?.id ?? null,
      requestedByName: owner?.name ?? null,
      approverId: approver.id,
      approverName: approver.name,
      createdAt: daysFromNow(-(def.completedDaysAgo ?? 1) - 1),
    });
  }

  return approvals;
}

function buildHistory(
  def: DemoProcessDef,
  steps: ProcessStep[],
  approvals: ProcessApproval[],
  owner: { id: string; name: string | null } | null,
): ProcessHistoryEntry[] {
  const entries: ProcessHistoryEntry[] = [];
  const createdAt =
    def.startedDaysAgo !== null ? daysFromNow(-def.startedDaysAgo) : daysFromNow(-1);

  entries.push({
    id: `${def.id}-history-created`,
    processId: def.id,
    processName: def.name,
    eventType: "processo_criado",
    description: `Processo "${def.name}" criado.`,
    metadata: {},
    actorName: owner?.name ?? null,
    createdAt,
  });

  for (const step of steps) {
    if (step.status === "concluido") {
      entries.push({
        id: `${def.id}-history-step-${step.id}`,
        processId: def.id,
        processName: def.name,
        eventType: "etapa_concluida",
        description: `Etapa "${step.name}" concluída.`,
        metadata: {},
        actorName: owner?.name ?? null,
        createdAt: step.completedAt ?? createdAt,
      });
    }
  }

  for (const approval of approvals) {
    entries.push({
      id: `${approval.id}-history-request`,
      processId: def.id,
      processName: def.name,
      eventType: "aprovacao_solicitada",
      description: "Aprovação solicitada.",
      metadata: {},
      actorName: approval.requestedByName,
      createdAt: approval.createdAt,
    });
    if (approval.status !== "pendente" && approval.decidedAt) {
      entries.push({
        id: `${approval.id}-history-decision`,
        processId: def.id,
        processName: def.name,
        eventType: "aprovacao_decidida",
        description: `Processo ${approval.status === "aprovado" ? "aprovado" : "reprovado"}${approval.approverName ? ` por ${approval.approverName}` : ""}.`,
        metadata: {},
        actorName: approval.approverName,
        createdAt: approval.decidedAt,
      });
    }
  }

  if (def.status === "arquivado") {
    entries.push({
      id: `${def.id}-history-archived`,
      processId: def.id,
      processName: def.name,
      eventType: "processo_arquivado",
      description: "Processo arquivado.",
      metadata: {},
      actorName: owner?.name ?? null,
      createdAt: def.completedDaysAgo !== null ? daysFromNow(-def.completedDaysAgo) : createdAt,
    });
  }

  return entries.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

function buildDocuments(def: DemoProcessDef): ProcessDocumentLink[] {
  if (!def.documentTitle) return [];
  return [
    {
      processId: def.id,
      documentId: `${def.id}-doc-0`,
      documentTitle: def.documentTitle,
      documentCategoryName: def.documentCategoryName ?? null,
      createdAt: daysFromNow(-1),
    },
  ];
}

function buildProcessDetail(def: DemoProcessDef): ProcessDetail {
  const category = categoryBySlug(def.categorySlug);
  const owner = def.ownerIndex !== null ? DEMO_OWNERS[def.ownerIndex] : null;
  const startedAt = def.startedDaysAgo !== null ? daysFromNow(-def.startedDaysAgo) : null;
  const completedAt = def.completedDaysAgo !== null ? daysFromNow(-def.completedDaysAgo) : null;

  const steps = buildSteps(def, startedAt);
  const checklistItems = steps.flatMap((step) => step.checklistItems);
  const checklistProgress = computeChecklistProgress(checklistItems);
  const stepsDoneCount = steps.filter((s) => s.status === "concluido").length;
  const approvals = buildApprovals(def, owner);
  const template = def.templateId ? DEMO_TEMPLATES.find((t) => t.id === def.templateId) : undefined;

  const updatedAt =
    completedAt ?? (startedAt && def.currentStepIndex >= 0 ? startedAt : daysFromNow(-1));

  return {
    id: def.id,
    name: def.name,
    description: def.description,
    categoryId: category.id,
    categoryName: category.name,
    categoryColor: category.color,
    categoryIcon: category.icon,
    ownerId: owner?.id ?? null,
    ownerName: owner?.name ?? null,
    status: def.status,
    estimatedMinutes: def.estimatedMinutes,
    executedMinutes: computeExecutedMinutes(startedAt, completedAt),
    startedAt,
    completedAt,
    clientId: def.clientId ?? null,
    clientCompany: def.clientCompany ?? null,
    projectId: def.projectId ?? null,
    projectName: def.projectName ?? null,
    crmLeadId: def.crmLeadId ?? null,
    crmLeadName: def.crmLeadName ?? null,
    templateId: template?.id ?? null,
    templateName: template?.name ?? null,
    stepCount: steps.length,
    stepsDoneCount,
    checklistTotal: checklistProgress.total,
    checklistDoneCount: checklistProgress.done,
    progressPercent: computeProcessProgressPercent({
      checklistTotal: checklistProgress.total,
      checklistDone: checklistProgress.done,
      stepTotal: steps.length,
      stepsDone: stepsDoneCount,
      status: def.status,
    }),
    pendingApprovalCount: approvals.filter((a) => a.status === "pendente").length,
    createdAt: startedAt ?? daysFromNow(-1),
    updatedAt,
    steps,
    standaloneChecklist: [],
    approvals,
    history: buildHistory(def, steps, approvals, owner),
    documents: buildDocuments(def),
    files: [],
  };
}

let cachedDetails: ProcessDetail[] | null = null;

function getAllDemoProcessDetails(): ProcessDetail[] {
  if (!cachedDetails) cachedDetails = DEMO_PROCESS_DEFS.map(buildProcessDetail);
  return cachedDetails;
}

function toSummary(detail: ProcessDetail): ProcessSummary {
  const { steps, standaloneChecklist, approvals, history, documents, files, ...summary } = detail;
  return summary;
}

export function getDemoProcessCategories(): ProcessCategory[] {
  const details = getAllDemoProcessDetails();
  return DEMO_CATEGORIES.map((category) => ({
    ...category,
    processCount: details.filter((d) => d.categoryId === category.id).length,
  }));
}

export function getDemoProcessTemplates(): ProcessTemplate[] {
  return DEMO_TEMPLATES;
}

function getDemoFilterOptions(): ProcessFilterOptions {
  const categories = getDemoProcessCategories();
  return {
    categories: categories.map((c) => ({ id: c.id, name: c.name, color: c.color })),
    owners: DEMO_OWNERS.map((owner) => ({ id: owner.id, name: owner.name })),
  };
}

export function getDemoProcessesPageData(filters: ProcessListFilters): ProcessesPageData {
  let processes = getAllDemoProcessDetails().map(toSummary);

  if (filters.categoryId) processes = processes.filter((p) => p.categoryId === filters.categoryId);
  if (filters.ownerId) processes = processes.filter((p) => p.ownerId === filters.ownerId);
  if (filters.status) processes = processes.filter((p) => p.status === filters.status);
  if (filters.clientId) processes = processes.filter((p) => p.clientId === filters.clientId);
  if (filters.projectId) processes = processes.filter((p) => p.projectId === filters.projectId);
  if (filters.search) {
    const term = filters.search.toLowerCase();
    processes = processes.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.description?.toLowerCase().includes(term) ||
        p.categoryName?.toLowerCase().includes(term),
    );
  }

  processes = [...processes].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));

  return { processes, total: processes.length, filterOptions: getDemoFilterOptions() };
}

export function getDemoProcessDashboardData(): ProcessDashboardData {
  const details = getAllDemoProcessDetails();
  const processes = details.map(toSummary);
  const categories = getDemoProcessCategories();
  const recentHistory = details
    .flatMap((d) => d.history)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, 12);
  const pendingApprovals = details
    .flatMap((d) => d.approvals)
    .filter((a) => a.status === "pendente");

  return buildProcessDashboardData(processes, categories, recentHistory, pendingApprovals);
}

export function getDemoProcessDetail(id: string): ProcessDetail | null {
  return getAllDemoProcessDetails().find((d) => d.id === id) ?? null;
}
