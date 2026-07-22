import type { ClientsPageData } from "@/application/crm/clientsQueries";
import type { DashboardData } from "@/application/crm/dashboardQueries";
import type { LeadDetailData, LeadsPageData } from "@/application/crm/leadsQueries";
import { LOST_REASON_LABEL } from "@/domain/crm/lostRules";
import {
  DEMO_LEADS,
  DEMO_OWNERS,
  DEMO_PIPELINE_STAGES,
  DEMO_STANDALONE_CLIENTS,
  type DemoLeadSeed,
  type DemoUtmSeed,
} from "@/lib/demo/mockSeed";
import type { RecentActivity } from "@/repositories/crm/activitiesRepository";
import type { ListClientsOptions } from "@/repositories/crm/clientsRepository";
import type {
  LossReasonCount,
  OriginCount,
  StageAvgDuration,
  StageConversion,
  StageCount,
  WinLossSummary,
} from "@/repositories/crm/dashboardRepository";
import type { ListLeadsOptions } from "@/repositories/crm/leadsRepository";
import type { RecentMaterialDownload } from "@/repositories/crm/marketingRepository";
import type { UpcomingTask } from "@/repositories/crm/tasksRepository";
import type {
  ClientWithOwner,
  CrmLead,
  CrmLeadWithPipelineInfo,
  CrmLeadWithRelations,
  PipelineColumn,
} from "@/types/crm";

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

function daysFromNowIso(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString();
}

function friendlyOriginLabel(utm: DemoUtmSeed | null): string | null {
  if (!utm) return null;
  if (utm.source === "google") return "Google Ads";
  if (utm.source === "facebook" || utm.source === "instagram") return "Meta Ads";
  if (utm.source === "tiktok") return "TikTok Ads";
  if (utm.source === "linkedin") return "LinkedIn Ads";
  if (utm.source === "indicacao") return "Indicação";
  if (utm.medium === "organic") return "Orgânico";
  if (!utm.source && !utm.referer) return "Direto";
  return "Outros";
}

function stageBySeed(seed: DemoLeadSeed) {
  const stage = DEMO_PIPELINE_STAGES.find((s) => s.key === seed.stageKey);
  if (!stage) throw new Error(`Estágio demo desconhecido: ${seed.stageKey}`);
  return stage;
}

function ownerBySeed(seed: DemoLeadSeed) {
  return seed.ownerIndex === null ? null : (DEMO_OWNERS[seed.ownerIndex] ?? null);
}

function toCrmLead(seed: DemoLeadSeed): CrmLead {
  const stage = stageBySeed(seed);
  return {
    id: seed.id,
    createdAt: daysAgoIso(seed.daysAgoCreated),
    updatedAt: daysAgoIso(Math.min(seed.daysAgoCreated, seed.daysInStage)),
    sourceLeadId: null,
    name: seed.name,
    company: seed.company,
    jobTitle: seed.jobTitle,
    city: seed.city,
    email: seed.email,
    phone: seed.phone,
    origin: friendlyOriginLabel(seed.utm),
    stageId: stage.id,
    ownerId: ownerBySeed(seed)?.id ?? null,
    potentialValue: seed.potentialValue,
    score: seed.score,
    tags: seed.tags,
    lastInteractionAt:
      seed.lastInteractionDaysAgo !== null ? daysAgoIso(seed.lastInteractionDaysAgo) : null,
    createdBy: DEMO_OWNERS[0].id,
    lostReason: seed.lost?.reason ?? null,
    lostAt: seed.lost ? daysAgoIso(seed.lost.daysAgo) : null,
  };
}

function toCrmLeadWithRelations(seed: DemoLeadSeed): CrmLeadWithRelations {
  return {
    ...toCrmLead(seed),
    stage: stageBySeed(seed),
    owner: ownerBySeed(seed),
  };
}

const ALL_DEMO_LEADS: CrmLeadWithRelations[] = DEMO_LEADS.map(toCrmLeadWithRelations);

function findSeed(leadId: string): DemoLeadSeed | undefined {
  return DEMO_LEADS.find((seed) => seed.id === leadId);
}

export function getDemoOwnerOptions() {
  return DEMO_OWNERS;
}

export function getDemoPipelineStages() {
  return DEMO_PIPELINE_STAGES;
}

// ---------------------------------------------------------------------------
// Leads (list) — mirrors listLeads' filtering/sorting/pagination so the
// Leads page toolbar stays functional in Demo Mode, not just decorative.
// ---------------------------------------------------------------------------
export function getDemoLeadsPageData(options: ListLeadsOptions = {}): LeadsPageData {
  let leads = [...ALL_DEMO_LEADS];

  if (options.status === "aberto") leads = leads.filter((l) => l.lostReason === null);
  if (options.status === "perdido") leads = leads.filter((l) => l.lostReason !== null);
  if (options.status === "ganho")
    leads = leads.filter((l) => l.lostReason === null && l.stage.isWon);

  if (options.stageId) leads = leads.filter((l) => l.stageId === options.stageId);
  if (options.ownerId) leads = leads.filter((l) => l.ownerId === options.ownerId);
  if (options.city) {
    const term = options.city.toLowerCase();
    leads = leads.filter((l) => l.city?.toLowerCase().includes(term));
  }
  if (options.tag) leads = leads.filter((l) => l.tags.includes(options.tag as string));
  if (options.scoreMin !== undefined)
    leads = leads.filter((l) => l.score >= (options.scoreMin as number));
  if (options.scoreMax !== undefined)
    leads = leads.filter((l) => l.score <= (options.scoreMax as number));
  if (options.createdFrom)
    leads = leads.filter((l) => l.createdAt >= (options.createdFrom as string));
  if (options.createdTo) leads = leads.filter((l) => l.createdAt <= (options.createdTo as string));
  if (options.search) {
    const term = options.search.toLowerCase();
    leads = leads.filter(
      (l) =>
        l.name.toLowerCase().includes(term) ||
        l.company?.toLowerCase().includes(term) ||
        l.email?.toLowerCase().includes(term) ||
        l.phone?.toLowerCase().includes(term),
    );
  }

  const sortBy = options.sortBy ?? "created_at";
  const sortDir = options.sortDir ?? "desc";
  const sortKeyMap: Record<string, keyof CrmLeadWithRelations> = {
    created_at: "createdAt",
    name: "name",
    potential_value: "potentialValue",
    score: "score",
    last_interaction_at: "lastInteractionAt",
  };
  const key = sortKeyMap[sortBy] ?? "createdAt";
  leads.sort((a, b) => {
    const av = a[key];
    const bv = b[key];
    if (av === null || av === undefined) return 1;
    if (bv === null || bv === undefined) return -1;
    if (av < bv) return sortDir === "asc" ? -1 : 1;
    if (av > bv) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const total = leads.length;
  const limit = options.limit ?? 50;
  const offset = options.offset ?? 0;

  return {
    leads: leads.slice(offset, offset + limit),
    total,
    stages: DEMO_PIPELINE_STAGES,
    owners: DEMO_OWNERS,
  };
}

// ---------------------------------------------------------------------------
// Pipeline (kanban)
// ---------------------------------------------------------------------------
export function getDemoPipelineData(): { columns: PipelineColumn[] } {
  const openLeads = DEMO_LEADS.filter((seed) => !seed.lost);

  const leadsWithPipelineInfo: CrmLeadWithPipelineInfo[] = openLeads.map((seed) => {
    const base = toCrmLeadWithRelations(seed);
    return {
      ...base,
      stageEnteredAt: daysAgoIso(seed.daysInStage),
      nextTask: seed.nextTask
        ? {
            id: `${seed.id}-task`,
            title: seed.nextTask.title,
            dueAt: daysFromNowIso(seed.nextTask.daysFromNow),
            priority: seed.nextTask.priority,
            assignee: ownerBySeed(seed),
          }
        : null,
    };
  });

  const columns: PipelineColumn[] = DEMO_PIPELINE_STAGES.map((stage) => ({
    stage,
    leads: leadsWithPipelineInfo.filter((lead) => lead.stageId === stage.id),
  }));

  return { columns };
}

// ---------------------------------------------------------------------------
// Lead Workspace header data
// ---------------------------------------------------------------------------
export function getDemoLeadDetailData(leadId: string): LeadDetailData | null {
  const seed = findSeed(leadId);
  if (!seed) return null;

  return {
    lead: toCrmLeadWithRelations(seed),
    sourceAttribution: null,
    materialDownloads: [],
    owners: DEMO_OWNERS,
    stages: DEMO_PIPELINE_STAGES,
  };
}

// ---------------------------------------------------------------------------
// Clientes
// ---------------------------------------------------------------------------
function wonSeedToClient(seed: DemoLeadSeed): ClientWithOwner {
  const owner = ownerBySeed(seed);
  return {
    id: `${seed.id}-client`,
    createdAt: daysAgoIso(seed.daysInStage),
    updatedAt: daysAgoIso(
      Math.min(seed.daysInStage, seed.lastInteractionDaysAgo ?? seed.daysInStage),
    ),
    sourceCrmLeadId: seed.id,
    company: seed.company,
    name: seed.name,
    email: seed.email,
    phone: seed.phone,
    ownerId: owner?.id ?? null,
    status: "ativo",
    createdBy: DEMO_OWNERS[0].id,
    owner,
  };
}

function standaloneToClient(seed: (typeof DEMO_STANDALONE_CLIENTS)[number]): ClientWithOwner {
  const owner = seed.ownerIndex === null ? null : (DEMO_OWNERS[seed.ownerIndex] ?? null);
  return {
    id: seed.id,
    createdAt: daysAgoIso(seed.daysAgoCreated),
    updatedAt: daysAgoIso(seed.daysAgoCreated),
    sourceCrmLeadId: null,
    company: seed.company,
    name: seed.name,
    email: seed.email,
    phone: seed.phone,
    ownerId: owner?.id ?? null,
    status: seed.status,
    createdBy: DEMO_OWNERS[0].id,
    owner,
  };
}

const ALL_DEMO_CLIENTS: ClientWithOwner[] = [
  ...DEMO_LEADS.filter((seed) => seed.becameClient).map(wonSeedToClient),
  ...DEMO_STANDALONE_CLIENTS.map(standaloneToClient),
];

export function getDemoClientsPageData(options: ListClientsOptions = {}): ClientsPageData {
  let clients = [...ALL_DEMO_CLIENTS];
  if (options.search) {
    const term = options.search.toLowerCase();
    clients = clients.filter(
      (c) =>
        c.company.toLowerCase().includes(term) ||
        c.name?.toLowerCase().includes(term) ||
        c.email?.toLowerCase().includes(term),
    );
  }
  clients.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return { clients, owners: DEMO_OWNERS };
}

export function getDemoClientDetailData(clientId: string): ClientWithOwner | null {
  return ALL_DEMO_CLIENTS.find((c) => c.id === clientId) ?? null;
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------
function startOfTodayIso(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
}

function startOfMonthIso(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

export function getDemoDashboardData(): DashboardData {
  const todayIso = startOfTodayIso();
  const monthIso = startOfMonthIso();

  const leadsToday = ALL_DEMO_LEADS.filter((l) => l.createdAt >= todayIso).length;
  const leadsThisMonth = ALL_DEMO_LEADS.filter((l) => l.createdAt >= monthIso).length;
  const wonThisMonth = ALL_DEMO_LEADS.filter(
    (l) => l.stage.isWon && l.updatedAt >= monthIso,
  ).length;
  const conversionRate = leadsThisMonth > 0 ? (wonThisMonth / leadsThisMonth) * 100 : 0;

  const withValue = ALL_DEMO_LEADS.filter((l) => l.potentialValue !== null);
  const averagePotentialValue =
    withValue.length > 0
      ? withValue.reduce((sum, l) => sum + (l.potentialValue ?? 0), 0) / withValue.length
      : null;

  const activeClients = ALL_DEMO_CLIENTS.filter((c) => c.status === "ativo").length;
  const newClientsThisMonth = ALL_DEMO_CLIENTS.filter((c) => c.createdAt >= monthIso).length;

  const stageCounts: StageCount[] = DEMO_PIPELINE_STAGES.map((stage) => ({
    stage,
    count: ALL_DEMO_LEADS.filter((l) => l.stageId === stage.id && l.lostReason === null).length,
  }));

  const originCounts: OriginCount[] = Object.entries(
    ALL_DEMO_LEADS.reduce<Record<string, number>>((acc, lead) => {
      const label = lead.origin || "Não informado";
      acc[label] = (acc[label] ?? 0) + 1;
      return acc;
    }, {}),
  )
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);

  const dailyLeadCounts = Array.from({ length: 14 }, (_, i) => {
    const dayOffset = 13 - i;
    const dateKey = new Date(Date.now() - dayOffset * 86_400_000).toISOString().slice(0, 10);
    const count = DEMO_LEADS.filter((seed) => seed.daysAgoCreated === dayOffset).length;
    return { date: dateKey, count };
  });

  const awaitingContact = ALL_DEMO_LEADS.filter(
    (l) => l.stage.position === 1 && l.lastInteractionAt === null && l.lostReason === null,
  ).slice(0, 6);

  const recentActivities: RecentActivity[] = [...DEMO_LEADS]
    .sort((a, b) => a.daysAgoCreated - b.daysAgoCreated)
    .slice(0, 8)
    .map((seed, index) => ({
      id: `${seed.id}-activity`,
      crmLeadId: seed.id,
      type: seed.lost ? "lead_lost" : index < 3 ? "system" : "stage_change",
      title: seed.lost
        ? `Lead marcado como perdido: ${LOST_REASON_LABEL[seed.lost.reason]}`
        : index < 3
          ? "Lead criado"
          : `Movido para ${stageBySeed(seed).label}`,
      body: null,
      metadata: null,
      dueAt: null,
      done: false,
      createdBy: ownerBySeed(seed)?.id ?? null,
      createdByName: ownerBySeed(seed)?.name ?? "Sistema",
      createdAt: daysAgoIso(seed.daysAgoCreated),
      leadName: seed.name,
    }));

  const upcomingTasks: UpcomingTask[] = DEMO_LEADS.filter((seed) => seed.nextTask)
    .map((seed) => ({
      id: `${seed.id}-task`,
      crmLeadId: seed.id,
      title: seed.nextTask?.title as string,
      description: null,
      status: "pending" as const,
      priority: seed.nextTask?.priority as "low" | "medium" | "high",
      dueAt: daysFromNowIso(seed.nextTask?.daysFromNow ?? 0),
      completedAt: null,
      assigneeId: ownerBySeed(seed)?.id ?? null,
      assignee: ownerBySeed(seed),
      createdBy: ownerBySeed(seed)?.id ?? null,
      createdAt: daysAgoIso(seed.daysAgoCreated),
      updatedAt: daysAgoIso(seed.daysAgoCreated),
      leadName: seed.name,
    }))
    .sort((a, b) => (a.dueAt as string).localeCompare(b.dueAt as string))
    .slice(0, 6);

  const recentDownloads: RecentMaterialDownload[] = [
    {
      id: "demo-download-1",
      materialSlug: "como-criar-software-white-label",
      materialTitle: "Como criar um software white label",
      createdAt: daysAgoIso(1),
      name: "Marcelo Tanaka",
      email: "marcelo.tanaka@vidaplena.demo",
    },
    {
      id: "demo-download-2",
      materialSlug: "checklist-transformacao-digital-empresarial",
      materialTitle: "Checklist de transformação digital empresarial",
      createdAt: daysAgoIso(2),
      name: "Isabela Monteiro",
      email: "isabela.monteiro@monteiroodonto.demo",
    },
    {
      id: "demo-download-3",
      materialSlug: "checklist-como-escolher-software-personalizado",
      materialTitle: "Checklist: como escolher um software personalizado",
      createdAt: daysAgoIso(4),
      name: "Felipe Aragão",
      email: "felipe.aragao@aragaotransportes.demo",
    },
  ];

  const stageConversion: StageConversion[] = (() => {
    let previous: number | null = null;
    return DEMO_PIPELINE_STAGES.map((stage) => {
      const enteredCount = ALL_DEMO_LEADS.filter((l) => l.stage.position >= stage.position).length;
      const conversionFromPrevious =
        previous !== null && previous > 0 ? (enteredCount / previous) * 100 : null;
      previous = enteredCount;
      return { stage, enteredCount, conversionFromPrevious };
    });
  })();

  const stageAvgDuration: StageAvgDuration[] = DEMO_PIPELINE_STAGES.map((stage) => ({
    stage,
    avgDays:
      stage.key === "novo"
        ? 2.4
        : stage.key === "contato"
          ? 4.1
          : stage.key === "qualificado"
            ? 6.8
            : stage.key === "proposta"
              ? 5.2
              : null,
  }));

  const wonCount = ALL_DEMO_LEADS.filter((l) => l.stage.isWon).length;
  const lostCount = ALL_DEMO_LEADS.filter((l) => l.lostReason !== null).length;
  const totalResolved = wonCount + lostCount;
  const winLossSummary: WinLossSummary = {
    won: wonCount,
    lost: lostCount,
    winRate: totalResolved > 0 ? (wonCount / totalResolved) * 100 : 0,
    lossRate: totalResolved > 0 ? (lostCount / totalResolved) * 100 : 0,
  };

  const lossReasons: LossReasonCount[] = Object.entries(
    ALL_DEMO_LEADS.filter((l) => l.lostReason).reduce<Record<string, number>>((acc, l) => {
      const reason = l.lostReason as string;
      acc[reason] = (acc[reason] ?? 0) + 1;
      return acc;
    }, {}),
  ).map(([reason, count]) => ({
    reason: reason as LossReasonCount["reason"],
    label: LOST_REASON_LABEL[reason as LossReasonCount["reason"]],
    count,
  }));

  const averageTimeToWinDays = 8.5;
  const leadsWithoutActivity = ALL_DEMO_LEADS.filter(
    (l) => l.lostReason === null && !l.stage.isWon && l.lastInteractionAt === null,
  ).length;
  const overdueLeads = DEMO_LEADS.filter(
    (seed) => seed.nextTask && seed.nextTask.daysFromNow < 0,
  ).length;

  return {
    kpis: {
      leadsToday,
      leadsThisMonth,
      conversionRate,
      averagePotentialValue,
      activeClients,
      newClientsThisMonth,
      downloadsThisMonth: recentDownloads.length,
      winRate: winLossSummary.winRate,
      lossRate: winLossSummary.lossRate,
      averageTimeToWinDays,
      leadsWithoutActivity,
      overdueLeads,
    },
    stageCounts,
    originCounts,
    dailyLeadCounts,
    awaitingContact,
    recentActivities,
    upcomingTasks,
    recentDownloads,
    stageConversion,
    stageAvgDuration,
    winLossSummary,
    lossReasons,
  };
}
