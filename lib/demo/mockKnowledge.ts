import { extractPlainText } from "@/domain/knowledge/blocks";
import { DEFAULT_KNOWLEDGE_CATEGORIES } from "@/domain/knowledge/defaultCategories";
import { getDemoClientsPageData } from "@/lib/demo/mockCrm";
import { getDemoProjects } from "@/lib/demo/mockProjects";
import type { ListDocumentsOptions } from "@/repositories/knowledge/documentsRepository";
import type {
  KnowledgeBlock,
  KnowledgeCategory,
  KnowledgeContentType,
  KnowledgeDocumentDetail,
  KnowledgeDocumentStatus,
  KnowledgeDocumentSummary,
  KnowledgeFile,
  KnowledgeSearchResult,
  KnowledgeTag,
  KnowledgeVersion,
} from "@/types/knowledge";

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function block(type: KnowledgeBlock["type"], data: Record<string, unknown>): KnowledgeBlock {
  return { id: `demo-blk-${Math.random().toString(36).slice(2)}`, type, data };
}

const DEMO_TAGS: KnowledgeTag[] = [
  { id: "00000000-c018-4000-8000-000000000101", name: "onboarding", slug: "onboarding" },
  { id: "00000000-c018-4000-8000-000000000102", name: "vendas", slug: "vendas" },
  { id: "00000000-c018-4000-8000-000000000103", name: "financeiro", slug: "financeiro" },
  { id: "00000000-c018-4000-8000-000000000104", name: "crm", slug: "crm" },
  { id: "00000000-c018-4000-8000-000000000105", name: "processos", slug: "processos" },
];

function categoryId(slug: string): string {
  const index = DEFAULT_KNOWLEDGE_CATEGORIES.findIndex((c) => c.slug === slug);
  return `00000000-c018-4000-8000-0000000002${String(index + 1).padStart(2, "0")}`;
}

export function getDemoKnowledgeCategories(): KnowledgeCategory[] {
  return DEFAULT_KNOWLEDGE_CATEGORIES.map((category, index) => ({
    id: categoryId(category.slug),
    name: category.name,
    slug: category.slug,
    description: null,
    icon: category.icon,
    color: category.color,
    isDefault: true,
    sortOrder: category.sortOrder,
    documentCount: DEMO_DOCUMENT_PLANS.filter((p) => p.categorySlug === category.slug).length,
    createdAt: daysAgo(200 - index),
  }));
}

export function getDemoKnowledgeTags(): KnowledgeTag[] {
  return DEMO_TAGS;
}

interface DemoDocumentPlan {
  id: string;
  title: string;
  categorySlug: string;
  contentType: KnowledgeContentType;
  status: KnowledgeDocumentStatus;
  summary: string;
  tagSlugs: string[];
  blocks: KnowledgeBlock[];
  updatedDaysAgo: number;
  createdDaysAgo: number;
  viewCount: number;
  favorite: boolean;
  pinned: boolean;
  linkClient?: boolean;
  linkProject?: boolean;
}

function idFor(n: number): string {
  return `00000000-c018-4000-8000-${String(n).padStart(12, "0")}`;
}

const DEMO_DOCUMENT_PLANS: DemoDocumentPlan[] = [
  {
    id: idFor(1),
    title: "Playbook Comercial",
    categorySlug: "comercial",
    contentType: "playbook",
    status: "publicado",
    summary: "Roteiro completo de abordagem, qualificação e fechamento usado pelo time comercial.",
    tagSlugs: ["vendas", "processos"],
    updatedDaysAgo: 2,
    createdDaysAgo: 140,
    viewCount: 86,
    favorite: true,
    pinned: true,
    blocks: [
      block("heading", { text: "Playbook Comercial" }),
      block("paragraph", {
        text: "Guia de referência para condução do funil comercial, do primeiro contato ao fechamento.",
      }),
      block("heading", { text: "Etapas do funil" }),
      block("list", {
        ordered: true,
        items: ["Qualificação", "Diagnóstico", "Proposta", "Negociação", "Fechamento"],
      }),
      block("alert", {
        tone: "info",
        text: "Sempre registrar a origem do lead antes de avançar para Qualificado.",
      }),
    ],
  },
  {
    id: idFor(2),
    title: "Manual do CRM",
    categorySlug: "tecnologia",
    contentType: "documento",
    status: "publicado",
    summary: "Como usar o Brusync OS no dia a dia — pipeline, clientes, projetos e financeiro.",
    tagSlugs: ["crm", "processos"],
    updatedDaysAgo: 5,
    createdDaysAgo: 160,
    viewCount: 132,
    favorite: true,
    pinned: false,
    blocks: [
      block("heading", { text: "Manual do CRM" }),
      block("paragraph", { text: "Este manual cobre os módulos principais do Brusync OS." }),
      block("heading", { text: "Módulos" }),
      block("checklist", {
        items: [
          { text: "Pipeline e Leads", done: false },
          { text: "Clientes", done: false },
          { text: "Projetos", done: false },
          { text: "Financeiro", done: false },
        ],
      }),
    ],
  },
  {
    id: idFor(3),
    title: "Processo Comercial",
    categorySlug: "comercial",
    contentType: "procedimento",
    status: "publicado",
    summary: "Procedimento padrão desde a entrada do lead até a assinatura do contrato.",
    tagSlugs: ["vendas", "processos"],
    updatedDaysAgo: 12,
    createdDaysAgo: 150,
    viewCount: 54,
    favorite: false,
    pinned: false,
    linkClient: true,
    blocks: [
      block("heading", { text: "Processo Comercial" }),
      block("table", {
        headers: ["Etapa", "Responsável", "Prazo"],
        rows: [
          ["Qualificação", "SDR", "1 dia"],
          ["Proposta", "Closer", "3 dias"],
          ["Fechamento", "Closer", "5 dias"],
        ],
      }),
    ],
  },
  {
    id: idFor(4),
    title: "Processo Financeiro",
    categorySlug: "financeiro",
    contentType: "procedimento",
    status: "publicado",
    summary: "Fluxo de lançamentos, cobrança e conciliação do módulo Financeiro.",
    tagSlugs: ["financeiro", "processos"],
    updatedDaysAgo: 20,
    createdDaysAgo: 130,
    viewCount: 41,
    favorite: false,
    pinned: false,
    blocks: [
      block("heading", { text: "Processo Financeiro" }),
      block("paragraph", { text: "Todo lançamento deve ser vinculado a um cliente ou projeto." }),
      block("list", {
        ordered: true,
        items: ["Criar lançamento", "Vincular cliente/projeto", "Acompanhar parcelas"],
      }),
    ],
  },
  {
    id: idFor(5),
    title: "Implantação",
    categorySlug: "operacao",
    contentType: "playbook",
    status: "em_revisao",
    summary: "Roteiro de implantação de um novo cliente, da assinatura ao go-live.",
    tagSlugs: ["onboarding", "processos"],
    updatedDaysAgo: 1,
    createdDaysAgo: 90,
    viewCount: 23,
    favorite: false,
    pinned: false,
    linkProject: true,
    blocks: [
      block("heading", { text: "Playbook de Implantação" }),
      block("list", {
        ordered: true,
        items: ["Configuração inicial", "Migração de dados", "Testes", "Treinamento", "Go-live"],
      }),
    ],
  },
  {
    id: idFor(6),
    title: "Onboarding",
    categorySlug: "rh",
    contentType: "checklist",
    status: "publicado",
    summary: "Checklist de recepção de novos colaboradores da Brusync.",
    tagSlugs: ["onboarding"],
    updatedDaysAgo: 30,
    createdDaysAgo: 200,
    viewCount: 67,
    favorite: false,
    pinned: false,
    blocks: [
      block("heading", { text: "Onboarding de Colaborador" }),
      block("checklist", {
        items: [
          { text: "Enviar boas-vindas", done: true },
          { text: "Criar acessos", done: true },
          { text: "Agendar kickoff", done: false },
        ],
      }),
    ],
  },
  {
    id: idFor(7),
    title: "FAQ",
    categorySlug: "comercial",
    contentType: "faq",
    status: "publicado",
    summary: "Perguntas frequentes de leads e clientes sobre o Brusync.",
    tagSlugs: ["vendas"],
    updatedDaysAgo: 3,
    createdDaysAgo: 110,
    viewCount: 98,
    favorite: true,
    pinned: false,
    blocks: [
      block("heading", { text: "Perguntas Frequentes" }),
      block("subheading", { text: "O Brusync substitui minhas planilhas?" }),
      block("paragraph", {
        text: "Sim — CRM, projetos, financeiro e comunicação em um único sistema.",
      }),
      block("subheading", { text: "É possível migrar dados existentes?" }),
      block("paragraph", { text: "Sim, a equipe de implantação conduz a migração inicial." }),
    ],
  },
  {
    id: idFor(8),
    title: "Checklist Comercial",
    categorySlug: "comercial",
    contentType: "checklist",
    status: "rascunho",
    summary: "Checklist rápido de qualificação usado antes de enviar uma proposta.",
    tagSlugs: ["vendas", "processos"],
    updatedDaysAgo: 0,
    createdDaysAgo: 6,
    viewCount: 4,
    favorite: false,
    pinned: false,
    blocks: [
      block("heading", { text: "Checklist Comercial" }),
      block("checklist", {
        items: [
          { text: "Orçamento confirmado", done: false },
          { text: "Decisor identificado", done: false },
          { text: "Prazo definido", done: false },
        ],
      }),
    ],
  },
  {
    id: idFor(9),
    title: "Política de Descontos",
    categorySlug: "juridico",
    contentType: "politica",
    status: "arquivado",
    summary: "Política antiga de descontos comerciais, substituída pelo Playbook Comercial atual.",
    tagSlugs: ["vendas"],
    updatedDaysAgo: 260,
    createdDaysAgo: 400,
    viewCount: 12,
    favorite: false,
    pinned: false,
    blocks: [
      block("heading", { text: "Política de Descontos (arquivada)" }),
      block("paragraph", { text: "Documento mantido apenas para referência histórica." }),
    ],
  },
];

function getDemoLinkedEntities() {
  const { clients } = getDemoClientsPageData({});
  const { projects } = getDemoProjects();
  return { client: clients[0] ?? null, project: projects[0] ?? null };
}

function buildSummary(plan: DemoDocumentPlan): KnowledgeDocumentSummary {
  const category = getDemoKnowledgeCategories().find((c) => c.slug === plan.categorySlug) ?? null;
  return {
    id: plan.id,
    title: plan.title,
    slug: plan.id,
    contentType: plan.contentType,
    status: plan.status,
    summary: plan.summary,
    categoryId: category?.id ?? null,
    categoryName: category?.name ?? null,
    categoryColor: category?.color ?? null,
    categoryIcon: category?.icon ?? null,
    tags: DEMO_TAGS.filter((t) => plan.tagSlugs.includes(t.slug)),
    viewCount: plan.viewCount,
    isFavorite: plan.favorite,
    isPinned: plan.pinned,
    createdBy: null,
    createdByName: "Camila Rocha",
    updatedAt: daysAgo(plan.updatedDaysAgo),
    createdAt: daysAgo(plan.createdDaysAgo),
    publishedAt:
      plan.status === "publicado" || plan.status === "arquivado"
        ? daysAgo(plan.createdDaysAgo)
        : null,
  };
}

export function getDemoKnowledgeDocuments(options: ListDocumentsOptions = {}): {
  documents: KnowledgeDocumentSummary[];
  total: number;
} {
  let plans = DEMO_DOCUMENT_PLANS;
  if (options.status) plans = plans.filter((p) => p.status === options.status);
  if (options.contentType) plans = plans.filter((p) => p.contentType === options.contentType);
  if (options.categoryId) {
    const cats = getDemoKnowledgeCategories();
    plans = plans.filter(
      (p) => cats.find((c) => c.slug === p.categorySlug)?.id === options.categoryId,
    );
  }
  if (options.documentIds) plans = plans.filter((p) => options.documentIds?.includes(p.id));
  if (options.search) {
    const term = options.search.toLowerCase();
    plans = plans.filter(
      (p) => p.title.toLowerCase().includes(term) || p.summary.toLowerCase().includes(term),
    );
  }

  const documents = plans
    .map(buildSummary)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  return { documents, total: documents.length };
}

export function getDemoKnowledgeDocumentDetail(id: string): KnowledgeDocumentDetail | null {
  const plan = DEMO_DOCUMENT_PLANS.find((p) => p.id === id);
  if (!plan) return null;

  const summary = buildSummary(plan);
  const { client, project } = getDemoLinkedEntities();

  return {
    ...summary,
    contentJson: plan.blocks,
    externalUrl: null,
    currentVersion: 2,
    updatedByName: "Camila Rocha",
    publishedByName: plan.status === "publicado" ? "Marcelo Tanaka" : null,
    files: getDemoKnowledgeFiles(id),
    clientId: plan.linkClient ? (client?.id ?? null) : null,
    clientCompany: plan.linkClient ? (client?.company ?? null) : null,
    projectId: plan.linkProject ? (project?.id ?? null) : null,
    projectName: plan.linkProject ? (project?.name ?? null) : null,
    crmLeadId: null,
    crmLeadName: null,
    conversationId: null,
    automationId: null,
    automationName: null,
    integrationId: null,
    integrationName: null,
    financialTransactionId: null,
    financialTransactionDescription: null,
  };
}

export function getDemoKnowledgeVersions(documentId: string): KnowledgeVersion[] {
  const plan = DEMO_DOCUMENT_PLANS.find((p) => p.id === documentId);
  if (!plan) return [];

  return [
    {
      id: `${documentId}-v2`,
      documentId,
      versionNumber: 2,
      title: plan.title,
      contentJson: plan.blocks,
      summary: plan.summary,
      changeNote: "Revisão de conteúdo e ajustes de formatação.",
      createdByName: "Camila Rocha",
      createdAt: daysAgo(plan.updatedDaysAgo),
    },
    {
      id: `${documentId}-v1`,
      documentId,
      versionNumber: 1,
      title: plan.title,
      contentJson: [
        block("heading", { text: plan.title }),
        block("paragraph", { text: "Versão inicial." }),
      ],
      summary: plan.summary,
      changeNote: "Criação do documento.",
      createdByName: "Marcelo Tanaka",
      createdAt: daysAgo(plan.createdDaysAgo),
    },
  ];
}

const DEMO_FILE_PLANS: { fileName: string; kind: KnowledgeFile["kind"]; documentId: string }[] = [
  { fileName: "playbook-comercial.pdf", kind: "pdf", documentId: idFor(1) },
  { fileName: "fluxograma-processo-comercial.png", kind: "imagem", documentId: idFor(3) },
  { fileName: "planilha-financeiro.xlsx", kind: "planilha", documentId: idFor(4) },
  { fileName: "apresentacao-onboarding.pptx", kind: "apresentacao", documentId: idFor(6) },
];

export function getDemoKnowledgeFiles(documentId: string | null): KnowledgeFile[] {
  const plans = documentId
    ? DEMO_FILE_PLANS.filter((f) => f.documentId === documentId)
    : DEMO_FILE_PLANS;
  return plans.map((plan, index) => ({
    id: `${plan.documentId}-file-${index}`,
    documentId: plan.documentId,
    storagePath: `demo/${plan.fileName}`,
    fileName: plan.fileName,
    fileSize: 240_000 + index * 15_000,
    mimeType: null,
    kind: plan.kind,
    uploadedByName: "Camila Rocha",
    createdAt: daysAgo(20 + index),
  }));
}

export function getDemoKnowledgeFavoriteDocuments(): KnowledgeDocumentSummary[] {
  return DEMO_DOCUMENT_PLANS.filter((p) => p.favorite).map(buildSummary);
}

export function getDemoKnowledgeRecentDocuments(limit = 10): KnowledgeDocumentSummary[] {
  return [...DEMO_DOCUMENT_PLANS]
    .sort((a, b) => a.createdDaysAgo - b.createdDaysAgo)
    .slice(0, limit)
    .map(buildSummary);
}

export function getDemoKnowledgeMostAccessedDocuments(limit = 10): KnowledgeDocumentSummary[] {
  return [...DEMO_DOCUMENT_PLANS]
    .sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, limit)
    .map(buildSummary);
}

export function getDemoKnowledgeDashboardData() {
  const documents = DEMO_DOCUMENT_PLANS.map(buildSummary);
  const categories = getDemoKnowledgeCategories();
  const staleThreshold = 90;

  return {
    documentsCount: documents.length,
    categoriesCount: categories.length,
    filesCount: DEMO_FILE_PLANS.length,
    viewsCount: DEMO_DOCUMENT_PLANS.reduce((sum, p) => sum + p.viewCount, 0),
    favoritesCount: DEMO_DOCUMENT_PLANS.filter((p) => p.favorite).length,
    publishedCount: DEMO_DOCUMENT_PLANS.filter((p) => p.status === "publicado").length,
    draftCount: DEMO_DOCUMENT_PLANS.filter((p) => p.status === "rascunho").length,
    recentDocuments: getDemoKnowledgeRecentDocuments(5),
    recentlyUpdated: [...documents]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5),
    mostAccessed: getDemoKnowledgeMostAccessedDocuments(5),
    staleDocuments: DEMO_DOCUMENT_PLANS.filter((p) => p.updatedDaysAgo > staleThreshold)
      .map(buildSummary)
      .slice(0, 5),
    categoryUsage: categories
      .map((category) => ({
        categoryName: category.name,
        documentCount: category.documentCount,
        viewCount: DEMO_DOCUMENT_PLANS.filter((p) => p.categorySlug === category.slug).reduce(
          (sum, p) => sum + p.viewCount,
          0,
        ),
      }))
      .sort((a, b) => b.documentCount - a.documentCount),
  };
}

export function searchDemoKnowledge(term: string): KnowledgeSearchResult[] {
  const cleaned = term.trim().toLowerCase();
  if (!cleaned) return [];

  return DEMO_DOCUMENT_PLANS.filter((plan) => {
    const haystack = [plan.title, plan.summary, extractPlainText(plan.blocks), ...plan.tagSlugs]
      .join(" ")
      .toLowerCase();
    return haystack.includes(cleaned);
  }).map((plan) => ({
    id: plan.id,
    title: plan.title,
    summary: plan.summary,
    contentType: plan.contentType,
    status: plan.status,
    categoryName:
      getDemoKnowledgeCategories().find((c) => c.slug === plan.categorySlug)?.name ?? null,
    matchedIn: ["titulo", "conteudo"] as KnowledgeSearchResult["matchedIn"],
    updatedAt: daysAgo(plan.updatedDaysAgo),
  }));
}
