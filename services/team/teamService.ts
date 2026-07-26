import "server-only";

import { getClientsPageData } from "@/application/crm/clientsQueries";
import { getDashboardData } from "@/application/crm/dashboardQueries";
import { getFinancialMarketingPageData } from "@/application/financial/financialMarketingQueries";
import { getMarketingDataset } from "@/application/marketingAnalytics/dataset";
import { getProjectsPageData } from "@/application/projects/projectsQueries";
import type { StaffMember } from "@/domain/performance/actualValue";
import { type ActualValueDataset, computeActualValue } from "@/domain/performance/actualValue";
import {
  computePercentComplete,
  computeProgressStatus,
  isAchieved,
} from "@/domain/performance/scoring";
import { buildDashboardIndicators, buildMemberBreakdowns } from "@/domain/team/dashboard";
import { computeMemberMetrics } from "@/domain/team/individualMetrics";
import { buildTeamRanking } from "@/domain/team/rankings";
import { getDemoAverageResponseMinutes } from "@/lib/demo/mockIntelligence";
import { DEMO_ENRICHED_LEADS } from "@/lib/demo/mockMarketing";
import {
  getDemoTeamCheckins,
  getDemoTeamFeedbacks,
  getDemoTeamGoals,
  getDemoTeamMembers,
  getDemoTeamNotifications,
  getDemoTeamRoles,
  getDemoTeamTimeOff,
} from "@/lib/demo/mockTeam";
import { getAverageResponseMinutes } from "@/repositories/intelligence/crossModuleRepository";
import {
  type CreateCheckinPayload,
  createCheckin as createCheckinRow,
  listCheckins,
  updateCheckinStatus as updateCheckinStatusRow,
} from "@/repositories/team/checkinsRepository";
import {
  type CreateFeedbackPayload,
  createFeedback as createFeedbackRow,
  listFeedbacks,
  updateFeedbackStatus as updateFeedbackStatusRow,
} from "@/repositories/team/feedbackRepository";
import { listGoalProgress, recordGoalProgress } from "@/repositories/team/goalProgressRepository";
import {
  archiveTeamGoal as archiveTeamGoalRow,
  type CreateTeamGoalPayload,
  createTeamGoal as createTeamGoalRow,
  listTeamGoals,
  type UpdateTeamGoalPayload,
  updateTeamGoal as updateTeamGoalRow,
} from "@/repositories/team/goalsRepository";
import {
  listNotifications,
  markNotificationRead,
} from "@/repositories/team/notificationsRepository";
import {
  listTeamMembers,
  listTeamRoles,
  type UpdateTeamMemberPayload,
  updateTeamMember as updateTeamMemberRow,
} from "@/repositories/team/teamMembersRepository";
import {
  type CreateTimeOffPayload,
  createTimeOff as createTimeOffRow,
  listTimeOff,
  updateTimeOffStatus as updateTimeOffStatusRow,
} from "@/repositories/team/timeOffRepository";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type {
  TeamCheckin,
  TeamCheckinsPageData,
  TeamDashboardData,
  TeamFeedback,
  TeamFeedbackPageData,
  TeamGoal,
  TeamGoalStatus,
  TeamGoalsPageData,
  TeamGoalWithProgress,
  TeamIndividualDashboardData,
  TeamMember,
  TeamMemberProfileData,
  TeamMembersPageData,
  TeamNotification,
  TeamTimeOff,
} from "@/types/team";

// ---------------------------------------------------------------------------
// Colaboradores
// ---------------------------------------------------------------------------

export async function getTeamMembersPageData(): Promise<TeamMembersPageData> {
  if (await isDemoModeActive()) {
    return { members: getDemoTeamMembers(), roles: getDemoTeamRoles() };
  }
  const supabase = await getSupabaseAuthClient();
  const [members, roles] = await Promise.all([listTeamMembers(supabase), listTeamRoles(supabase)]);
  return { members, roles };
}

async function getAllMembers(): Promise<TeamMember[]> {
  return (await getTeamMembersPageData()).members;
}

export async function updateTeamMember(id: string, patch: UpdateTeamMemberPayload): Promise<void> {
  const supabase = await getSupabaseAuthClient();
  return updateTeamMemberRow(supabase, id, patch);
}

// ---------------------------------------------------------------------------
// Dataset compartilhado (leads/projetos/clientes/receita) — mesmo princípio
// de services/performance/performanceService.ts::buildActualValueDataset:
// reaproveita 100% dos módulos já existentes (CRM, Projetos, Financeiro),
// nenhuma leitura nova além de team_* em si. `periodStart`/`periodEnd`
// nulos = snapshot "tempo todo", usado pelo dashboard e pelo perfil
// individual; informados = escopo de UMA meta (mesmo padrão de período por
// meta da Fase 23).
// ---------------------------------------------------------------------------

interface TeamWideDataset {
  actualValue: ActualValueDataset;
  clientOwnerIds: (string | null)[];
  clientOwnerIdsByCreatedAt: { ownerId: string | null; createdAt: string }[];
  checkins: TeamCheckin[];
  feedbacks: TeamFeedback[];
}

function withinPeriod(iso: string, periodStart: string, periodEnd: string): boolean {
  const t = new Date(iso).getTime();
  const start = new Date(periodStart).getTime();
  const end = new Date(`${periodEnd}T23:59:59.999`).getTime();
  return t >= start && t <= end;
}

async function getLeads(periodStart?: string, periodEnd?: string) {
  const leads = await (async () => {
    if (await isDemoModeActive()) return DEMO_ENRICHED_LEADS;
    const { leads } = await getMarketingDataset(
      periodStart && periodEnd ? { createdFrom: periodStart, createdTo: periodEnd } : {},
    );
    return leads;
  })();
  if (!periodStart || !periodEnd) return leads;
  return leads.filter((lead) => withinPeriod(lead.createdAt, periodStart, periodEnd));
}

async function getAverageResponseMinutesNow(): Promise<number | null> {
  if (await isDemoModeActive()) return getDemoAverageResponseMinutes();
  const supabase = await getSupabaseAuthClient();
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString();
  return getAverageResponseMinutes(supabase, from, now.toISOString());
}

function staffFromMembers(members: TeamMember[]): StaffMember[] {
  return members.map((m) => ({
    id: m.profileId,
    name: m.name,
    email: m.email,
    role: m.accessRole,
  }));
}

async function buildTeamWideDataset(
  members: TeamMember[],
  periodStart?: string,
  periodEnd?: string,
): Promise<TeamWideDataset> {
  const [
    leads,
    projectsPage,
    clientsPage,
    financialMarketing,
    avgResponseMinutes,
    checkins,
    feedbacks,
  ] = await Promise.all([
    getLeads(periodStart, periodEnd),
    getProjectsPageData({ limit: 5000 }),
    getClientsPageData(),
    getFinancialMarketingPageData(),
    getAverageResponseMinutesNow(),
    getAllCheckins(),
    getAllFeedbacks(),
  ]);

  const actualValue: ActualValueDataset = {
    leads,
    projects: projectsPage.projects,
    agendaEvents: [],
    staff: staffFromMembers(members),
    financialMarketing,
    company: {
      averageTicket: 0,
      receivedRevenue: 0,
      overdueInstallmentsCount: 0,
      cac: null,
      roi: null,
      roas: null,
      averageResponseMinutes: avgResponseMinutes,
      averageTimeToFirstContactDays: null,
      averageTimeToWinDays: null,
      predictedRevenue: 0,
      confirmedRevenue: 0,
      lostRevenue: 0,
    },
  };

  return {
    actualValue,
    clientOwnerIds: clientsPage.clients.map((c) => c.ownerId),
    clientOwnerIdsByCreatedAt: clientsPage.clients.map((c) => ({
      ownerId: c.ownerId,
      createdAt: c.createdAt,
    })),
    checkins,
    feedbacks,
  };
}

async function getAllCheckins(): Promise<TeamCheckin[]> {
  if (await isDemoModeActive()) return getDemoTeamCheckins();
  const supabase = await getSupabaseAuthClient();
  return listCheckins(supabase);
}

async function getAllFeedbacks(): Promise<TeamFeedback[]> {
  if (await isDemoModeActive()) return getDemoTeamFeedbacks();
  const supabase = await getSupabaseAuthClient();
  return listFeedbacks(supabase);
}

/** "Atividades" não corresponde a nenhum dado existente — única exceção ao
 * "reaproveitar sempre": contamos check-ins + feedbacks registrados para o
 * colaborador no período como proxy de atividade de gestão de pessoas, sem
 * criar tabela nova (o dado já é o de team_checkins/team_feedbacks). */
function countActivities(
  member: TeamMember,
  dataset: TeamWideDataset,
  periodStart: string,
  periodEnd: string,
): number {
  const checkinCount = dataset.checkins.filter(
    (c) => c.teamMemberId === member.id && withinPeriod(c.scheduledAt, periodStart, periodEnd),
  ).length;
  const feedbackCount = dataset.feedbacks.filter(
    (f) =>
      f.recipientTeamMemberId === member.id && withinPeriod(f.createdAt, periodStart, periodEnd),
  ).length;
  return checkinCount + feedbackCount;
}

function computeGoalActualValue(
  goal: TeamGoal,
  member: TeamMember,
  dataset: TeamWideDataset,
): number | null {
  const scope = { scopeType: "usuario" as const, scopeRef: member.profileId };
  switch (goal.type) {
    case "leads":
      return dataset.actualValue.leads.filter((l) => l.ownerId === member.profileId).length;
    case "projetos":
      return dataset.actualValue.projects.filter((p) => p.ownerId === member.profileId).length;
    case "clientes":
      return dataset.clientOwnerIdsByCreatedAt.filter(
        (c) =>
          c.ownerId === member.profileId &&
          withinPeriod(c.createdAt, goal.periodStart, goal.periodEnd),
      ).length;
    case "receita":
      return computeActualValue("receita", scope, dataset.actualValue);
    case "conversao":
      return computeActualValue("conversao", scope, dataset.actualValue);
    case "atividades":
      return countActivities(member, dataset, goal.periodStart, goal.periodEnd);
    case "tempo_resposta":
      // Sem quebra por responsável em nenhum módulo existente (mesma
      // limitação aceita por domain/performance/actualValue.ts para
      // 'tempo_resposta' fora do escopo 'empresa') — usa o agregado da
      // operação inteira.
      return dataset.actualValue.company.averageResponseMinutes;
    default:
      return null;
  }
}

async function computeGoalsWithProgress(
  goals: TeamGoal[],
  membersById: Map<string, TeamMember>,
): Promise<TeamGoalWithProgress[]> {
  const members = [...membersById.values()];
  const datasetByPeriod = new Map<string, Promise<TeamWideDataset>>();
  const now = new Date();

  const results: TeamGoalWithProgress[] = [];
  for (const goal of goals) {
    const member = membersById.get(goal.teamMemberId);
    if (!member) continue;

    const periodKey = `${goal.periodStart}:${goal.periodEnd}`;
    let datasetPromise = datasetByPeriod.get(periodKey);
    if (!datasetPromise) {
      datasetPromise = buildTeamWideDataset(members, goal.periodStart, goal.periodEnd);
      datasetByPeriod.set(periodKey, datasetPromise);
    }
    const dataset = await datasetPromise;

    const actualValue = computeGoalActualValue(goal, member, dataset);
    const percentComplete = computePercentComplete(actualValue, goal.targetValue, goal.direction);
    const progressStatus = computeProgressStatus(
      percentComplete,
      goal.periodStart,
      goal.periodEnd,
      now,
    );

    results.push({
      ...goal,
      memberName: member.name ?? member.email,
      actualValue,
      percentComplete,
      progressStatus,
      history: [],
    });
  }

  return results;
}

async function getGoalsForStatus(
  status: TeamGoalStatus,
  teamMemberId?: string,
): Promise<TeamGoal[]> {
  if (await isDemoModeActive()) return getDemoTeamGoals(status, teamMemberId);
  const supabase = await getSupabaseAuthClient();
  return listTeamGoals(supabase, { status, teamMemberId });
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export async function getTeamDashboardData(): Promise<TeamDashboardData> {
  const members = await getAllMembers();
  const membersById = new Map(members.map((m) => [m.id, m]));

  const [activeGoals, dataset, dashboard] = await Promise.all([
    getGoalsForStatus("ativa"),
    buildTeamWideDataset(members),
    getDashboardData(),
  ]);

  const goalsWithProgress = await computeGoalsWithProgress(activeGoals, membersById);

  const goalsAchieved = goalsWithProgress.filter((g) => isAchieved(g.progressStatus)).length;
  const goalsAtRisk = goalsWithProgress.filter((g) => g.progressStatus === "em_risco").length;
  const novoStage = dashboard.stageAvgDuration.find((s) => s.stage.key === "novo");

  const metricsById = new Map(
    members.map((m) => [
      m.profileId,
      computeMemberMetrics(m.profileId, dataset.actualValue, dataset.clientOwnerIds),
    ]),
  );

  const goalsByMember = new Map<string, { achieved: number; total: number }>();
  for (const goal of goalsWithProgress) {
    const current = goalsByMember.get(goal.teamMemberId) ?? { achieved: 0, total: 0 };
    if (goal.percentComplete !== null) current.total += 1;
    if (isAchieved(goal.progressStatus)) current.achieved += 1;
    goalsByMember.set(goal.teamMemberId, current);
  }

  const indicators = buildDashboardIndicators({
    members,
    goalPercents: goalsWithProgress.map((g) => g.percentComplete),
    goalsAchieved,
    goalsAtRisk,
    averageResponseMinutes: dataset.actualValue.company.averageResponseMinutes,
    averageTimeToFirstContactDays: novoStage?.avgDays ?? null,
  });

  const breakdowns = buildMemberBreakdowns(members, metricsById);
  const ranking = buildTeamRanking(members, metricsById, goalsByMember);

  return { indicators, ...breakdowns, ranking };
}

// ---------------------------------------------------------------------------
// Perfil / dashboard individual
// ---------------------------------------------------------------------------

export async function getTeamMemberProfileData(
  teamMemberId: string,
): Promise<TeamMemberProfileData | null> {
  const members = await getAllMembers();
  const member = members.find((m) => m.id === teamMemberId);
  if (!member) return null;
  const membersById = new Map(members.map((m) => [m.id, m]));

  const [goals, dataset, feedbacks, checkins, timeOff] = await Promise.all([
    getGoalsForStatus("ativa", teamMemberId),
    buildTeamWideDataset(members),
    getMemberFeedbacks(teamMemberId),
    getMemberCheckins(teamMemberId),
    getMemberTimeOff(teamMemberId),
  ]);

  const goalsWithProgress = await computeGoalsWithProgress(goals, membersById);
  const metrics = computeMemberMetrics(
    member.profileId,
    dataset.actualValue,
    dataset.clientOwnerIds,
  );

  return { member, metrics, goals: goalsWithProgress, feedbacks, checkins, timeOff };
}

export async function getTeamIndividualDashboardData(
  selectedMemberId?: string,
): Promise<TeamIndividualDashboardData> {
  const members = await getAllMembers();
  const options = members.map((m) => ({ id: m.id, name: m.name, photoUrl: m.photoUrl }));
  const memberId = selectedMemberId ?? options[0]?.id ?? null;
  if (!memberId) return { members: options, selectedMemberId: null, profile: null };

  const profile = await getTeamMemberProfileData(memberId);
  return { members: options, selectedMemberId: memberId, profile };
}

// ---------------------------------------------------------------------------
// Metas
// ---------------------------------------------------------------------------

export async function getTeamGoalsPageData(): Promise<TeamGoalsPageData> {
  const members = await getAllMembers();
  const membersById = new Map(members.map((m) => [m.id, m]));

  const [active, archived] = await Promise.all([
    getGoalsForStatus("ativa"),
    getGoalsForStatus("arquivada"),
  ]);
  const goals = await computeGoalsWithProgress([...active, ...archived], membersById);

  return {
    goals,
    members: members.map((m) => ({ id: m.id, name: m.name ?? m.email })),
  };
}

export async function createTeamGoal(payload: CreateTeamGoalPayload): Promise<TeamGoal> {
  const supabase = await getSupabaseAuthClient();
  return createTeamGoalRow(supabase, payload);
}

export async function updateTeamGoal(id: string, patch: UpdateTeamGoalPayload): Promise<void> {
  const supabase = await getSupabaseAuthClient();
  return updateTeamGoalRow(supabase, id, patch);
}

export async function archiveTeamGoal(id: string): Promise<void> {
  const supabase = await getSupabaseAuthClient();
  return archiveTeamGoalRow(supabase, id);
}

export async function recordTeamGoalProgress(
  goalId: string,
  actualValue: number | null,
  percentComplete: number | null,
  createdBy: string | null,
): Promise<void> {
  const supabase = await getSupabaseAuthClient();
  return recordGoalProgress(supabase, { goalId, actualValue, percentComplete, createdBy });
}

export async function getTeamGoalHistory(goalId: string) {
  const supabase = await getSupabaseAuthClient();
  return listGoalProgress(supabase, goalId);
}

// ---------------------------------------------------------------------------
// Feedback
// ---------------------------------------------------------------------------

async function getMemberFeedbacks(teamMemberId: string): Promise<TeamFeedback[]> {
  if (await isDemoModeActive()) return getDemoTeamFeedbacks(teamMemberId);
  const supabase = await getSupabaseAuthClient();
  return listFeedbacks(supabase, { recipientTeamMemberId: teamMemberId });
}

export async function getTeamFeedbackPageData(): Promise<TeamFeedbackPageData> {
  const members = await getAllMembers();
  const feedbacks = await getAllFeedbacks();
  return {
    feedbacks,
    members: members.map((m) => ({ id: m.id, name: m.name ?? m.email })),
  };
}

export async function createTeamFeedback(payload: CreateFeedbackPayload): Promise<void> {
  const supabase = await getSupabaseAuthClient();
  return createFeedbackRow(supabase, payload);
}

export async function updateTeamFeedbackStatus(
  id: string,
  status: Parameters<typeof updateFeedbackStatusRow>[2],
): Promise<void> {
  const supabase = await getSupabaseAuthClient();
  return updateFeedbackStatusRow(supabase, id, status);
}

// ---------------------------------------------------------------------------
// Check-ins
// ---------------------------------------------------------------------------

async function getMemberCheckins(teamMemberId: string): Promise<TeamCheckin[]> {
  if (await isDemoModeActive()) return getDemoTeamCheckins(teamMemberId);
  const supabase = await getSupabaseAuthClient();
  return listCheckins(supabase, { teamMemberId });
}

export async function getTeamCheckinsPageData(): Promise<TeamCheckinsPageData> {
  const members = await getAllMembers();
  const checkins = await getAllCheckins();
  return {
    checkins,
    members: members.map((m) => ({ id: m.id, name: m.name ?? m.email })),
  };
}

export async function createTeamCheckin(payload: CreateCheckinPayload): Promise<void> {
  const supabase = await getSupabaseAuthClient();
  return createCheckinRow(supabase, payload);
}

export async function updateTeamCheckinStatus(
  id: string,
  status: Parameters<typeof updateCheckinStatusRow>[2],
): Promise<void> {
  const supabase = await getSupabaseAuthClient();
  return updateCheckinStatusRow(supabase, id, status);
}

// ---------------------------------------------------------------------------
// Ausências
// ---------------------------------------------------------------------------

async function getMemberTimeOff(teamMemberId: string): Promise<TeamTimeOff[]> {
  if (await isDemoModeActive()) return getDemoTeamTimeOff(teamMemberId);
  const supabase = await getSupabaseAuthClient();
  return listTimeOff(supabase, { teamMemberId });
}

export async function getAllTimeOff(): Promise<TeamTimeOff[]> {
  if (await isDemoModeActive()) return getDemoTeamTimeOff();
  const supabase = await getSupabaseAuthClient();
  return listTimeOff(supabase);
}

export async function createTeamTimeOff(payload: CreateTimeOffPayload): Promise<void> {
  const supabase = await getSupabaseAuthClient();
  return createTimeOffRow(supabase, payload);
}

export async function updateTeamTimeOffStatus(
  id: string,
  status: Parameters<typeof updateTimeOffStatusRow>[2],
): Promise<void> {
  const supabase = await getSupabaseAuthClient();
  return updateTimeOffStatusRow(supabase, id, status);
}

// ---------------------------------------------------------------------------
// Notificações
// ---------------------------------------------------------------------------

export async function getTeamNotifications(teamMemberId?: string): Promise<TeamNotification[]> {
  if (await isDemoModeActive()) return getDemoTeamNotifications(teamMemberId);
  const supabase = await getSupabaseAuthClient();
  return listNotifications(supabase, teamMemberId);
}

export async function markTeamNotificationRead(id: string): Promise<void> {
  const supabase = await getSupabaseAuthClient();
  return markNotificationRead(supabase, id);
}
