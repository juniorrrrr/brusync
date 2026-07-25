import "server-only";

import { getAgendaPageData } from "@/application/agenda/agendaQueries";
import { getDashboardData } from "@/application/crm/dashboardQueries";
import { getFinancialDashboardPageData } from "@/application/financial/financialDashboardQueries";
import { getFinancialMarketingPageData } from "@/application/financial/financialMarketingQueries";
import { getMarketingDataset } from "@/application/marketingAnalytics/dataset";
import { getProjectsPageData } from "@/application/projects/projectsQueries";
import { MARKETING_ORIGIN_LABEL } from "@/domain/marketing/originRules";
import {
  type ActualValueDataset,
  type ActualValueScope,
  computeActualValue,
  type StaffMember,
} from "@/domain/performance/actualValue";
import { buildPerformanceAlerts } from "@/domain/performance/alerts";
import {
  GOAL_SCOPE_LABEL,
  GOAL_TYPE_META,
  STAFF_ROLE_LABEL,
  type StaffRole,
} from "@/domain/performance/goalTypes";
import { resolveComparisonRange } from "@/domain/performance/periods";
import { buildPerformanceRankings } from "@/domain/performance/rankings";
import {
  computePercentComplete,
  computeProgressStatus,
  isAchieved,
} from "@/domain/performance/scoring";
import { buildConversionBreakdowns } from "@/domain/revenueIntelligence/conversionBreakdown";
import { getDemoAverageResponseMinutes, getDemoOwnerConversion } from "@/lib/demo/mockIntelligence";
import { DEMO_ENRICHED_LEADS } from "@/lib/demo/mockMarketing";
import { getDemoGoals, getDemoStaffWithRole } from "@/lib/demo/mockPerformance";
import {
  getAverageResponseMinutes,
  getOwnerConversion,
} from "@/repositories/intelligence/crossModuleRepository";
import {
  archiveGoal as archiveGoalRow,
  type CreateGoalPayload,
  createGoal as createGoalRow,
  listGoals,
  type UpdateGoalPayload,
  updateGoal as updateGoalRow,
} from "@/repositories/performance/goalsRepository";
import { listStaffWithRole } from "@/repositories/performance/staffRepository";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { getRevenueForecastData } from "@/services/revenueIntelligence/revenueIntelligenceService";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type {
  ComparisonPeriodKey,
  ComparisonPoint,
  GoalScopeType,
  GoalStatus,
  GoalWithProgress,
  PerformanceCommercialData,
  PerformanceComparisons,
  PerformanceExecutiveData,
  PerformanceFinancialData,
  PerformanceGoal,
  PerformanceGoalsPageData,
  PerformanceIndividualData,
  PerformanceMarketingData,
  PerformanceTeamData,
  Scorecard,
} from "@/types/performance";

async function getStaffWithRole(): Promise<StaffMember[]> {
  if (await isDemoModeActive()) return getDemoStaffWithRole();
  const supabase = await getSupabaseAuthClient();
  return listStaffWithRole(supabase);
}

async function getAverageResponseMinutesFor(from: string, to: string): Promise<number | null> {
  if (await isDemoModeActive()) return getDemoAverageResponseMinutes();
  const supabase = await getSupabaseAuthClient();
  return getAverageResponseMinutes(supabase, from, to);
}

async function getOwnerConversionRows() {
  if (await isDemoModeActive()) return getDemoOwnerConversion();
  const supabase = await getSupabaseAuthClient();
  return getOwnerConversion(supabase);
}

function withinPeriod(iso: string, periodStart: string, periodEnd: string): boolean {
  const t = new Date(iso).getTime();
  const start = new Date(periodStart).getTime();
  const end = new Date(`${periodEnd}T23:59:59.999`).getTime();
  return t >= start && t <= end;
}

function exclusiveDayAfter(dateOnly: string): string {
  const d = new Date(`${dateOnly}T00:00:00.000`);
  d.setDate(d.getDate() + 1);
  return d.toISOString();
}

async function getLeadsForPeriod(periodStart: string, periodEnd: string) {
  const leads = await (async () => {
    if (await isDemoModeActive()) return DEMO_ENRICHED_LEADS;
    const { leads } = await getMarketingDataset({ createdFrom: periodStart, createdTo: periodEnd });
    return leads;
  })();
  return leads.filter((lead) => withinPeriod(lead.createdAt, periodStart, periodEnd));
}

async function getMeetingsForPeriod(periodStart: string, periodEnd: string) {
  const { events } = await getAgendaPageData({
    eventType: "reuniao",
    scheduledFrom: periodStart,
    scheduledTo: exclusiveDayAfter(periodEnd),
    limit: 5000,
  });
  return events;
}

async function getAllProjects() {
  const { projects } = await getProjectsPageData({ limit: 5000 });
  return projects;
}

/** Monta o dataset necessário para calcular o valor realizado de UMA meta —
 * reaproveita 100% de funções já demo-aware ou já existentes
 * (repositories/intelligence/crossModuleRepository, application/*); a única
 * leitura nova é `listStaffWithRole` (necessária para o agrupamento por
 * "equipe", que não existe em lugar nenhum do schema). */
async function buildActualValueDataset(
  periodStart: string,
  periodEnd: string,
): Promise<ActualValueDataset> {
  const [
    leads,
    projects,
    agendaEvents,
    staff,
    dashboard,
    financial,
    financialMarketing,
    forecast,
    avgResponseMinutes,
  ] = await Promise.all([
    getLeadsForPeriod(periodStart, periodEnd),
    getAllProjects(),
    getMeetingsForPeriod(periodStart, periodEnd),
    getStaffWithRole(),
    getDashboardData(),
    getFinancialDashboardPageData(),
    getFinancialMarketingPageData(),
    getRevenueForecastData(),
    getAverageResponseMinutesFor(periodStart, periodEnd),
  ]);

  const novoStage = dashboard.stageAvgDuration.find((s) => s.stage.key === "novo");

  return {
    leads,
    projects,
    agendaEvents,
    staff,
    financialMarketing,
    company: {
      averageTicket: financial.averageTicket,
      receivedRevenue: financial.receivedRevenue,
      overdueInstallmentsCount: financial.overdueCount,
      cac: financialMarketing.cac,
      roi: financialMarketing.roi,
      roas: financialMarketing.roas,
      averageResponseMinutes: avgResponseMinutes,
      averageTimeToFirstContactDays: novoStage?.avgDays ?? null,
      averageTimeToWinDays: dashboard.kpis.averageTimeToWinDays,
      predictedRevenue: forecast.summary.predictedRevenue,
      confirmedRevenue: forecast.summary.confirmedRevenue,
      lostRevenue: forecast.summary.lostRevenue,
    },
  };
}

function resolveScopeLabel(
  scopeType: GoalScopeType,
  scopeRef: string | null,
  staff: StaffMember[],
): string {
  if (scopeType === "empresa") return "Empresa";
  if (!scopeRef) return GOAL_SCOPE_LABEL[scopeType];
  if (scopeType === "equipe") return STAFF_ROLE_LABEL[scopeRef as StaffRole] ?? scopeRef;
  if (scopeType === "usuario") {
    const member = staff.find((s) => s.id === scopeRef);
    return member?.name ?? member?.email ?? scopeRef;
  }
  if (scopeType === "origem") {
    return MARKETING_ORIGIN_LABEL[scopeRef as keyof typeof MARKETING_ORIGIN_LABEL] ?? scopeRef;
  }
  return scopeRef;
}

/** Une meta + valor realizado — chamado por todas as telas, um dataset por
 * período distinto entre as metas passadas (metas com o mesmo period_start/
 * period_end reaproveitam o mesmo dataset, nunca uma busca por meta). */
export async function computeGoalsWithProgress(
  goals: PerformanceGoal[],
): Promise<GoalWithProgress[]> {
  const datasetByPeriod = new Map<string, Promise<ActualValueDataset>>();
  const now = new Date();

  const results: GoalWithProgress[] = [];
  for (const goal of goals) {
    const periodKey = `${goal.periodStart}:${goal.periodEnd}`;
    let datasetPromise = datasetByPeriod.get(periodKey);
    if (!datasetPromise) {
      datasetPromise = buildActualValueDataset(goal.periodStart, goal.periodEnd);
      datasetByPeriod.set(periodKey, datasetPromise);
    }
    const dataset = await datasetPromise;

    const scope: ActualValueScope = { scopeType: goal.scopeType, scopeRef: goal.scopeRef };
    const actualValue = computeActualValue(goal.type, scope, dataset);
    const percentComplete = computePercentComplete(actualValue, goal.targetValue, goal.direction);
    const progressStatus = computeProgressStatus(
      percentComplete,
      goal.periodStart,
      goal.periodEnd,
      now,
    );

    results.push({
      ...goal,
      scopeLabel: resolveScopeLabel(goal.scopeType, goal.scopeRef, dataset.staff),
      actualValue,
      percentComplete,
      progressStatus,
    });
  }

  return results;
}

async function getGoalsForStatus(status: GoalStatus): Promise<PerformanceGoal[]> {
  if (await isDemoModeActive()) return getDemoGoals(status);
  const supabase = await getSupabaseAuthClient();
  return listGoals(supabase, { status });
}

async function getGoalsWithProgress(status: GoalStatus = "ativa"): Promise<GoalWithProgress[]> {
  return computeGoalsWithProgress(await getGoalsForStatus(status));
}

function buildComparisonPoint(
  key: string,
  label: string,
  currentValue: number,
  previousValue: number,
  favorableWhenHigher: boolean,
): ComparisonPoint {
  const changePercent =
    previousValue !== 0 ? ((currentValue - previousValue) / previousValue) * 100 : null;
  return { key, label, currentValue, previousValue, changePercent, favorableWhenHigher };
}

async function getComparisons(period: ComparisonPeriodKey): Promise<PerformanceComparisons> {
  const { current, previous } = resolveComparisonRange(period, new Date());
  const [currentDataset, previousDataset] = await Promise.all([
    buildActualValueDataset(current.from.slice(0, 10), current.to.slice(0, 10)),
    buildActualValueDataset(previous.from.slice(0, 10), previous.to.slice(0, 10)),
  ]);

  const empresa: ActualValueScope = { scopeType: "empresa", scopeRef: null };
  const revenueNow = computeActualValue("receita", empresa, currentDataset) ?? 0;
  const revenuePrev = computeActualValue("receita", empresa, previousDataset) ?? 0;
  const leadsNow = computeActualValue("leads", empresa, currentDataset) ?? 0;
  const leadsPrev = computeActualValue("leads", empresa, previousDataset) ?? 0;
  const conversionNow = computeActualValue("conversao", empresa, currentDataset) ?? 0;
  const conversionPrev = computeActualValue("conversao", empresa, previousDataset) ?? 0;

  return {
    period,
    revenue: buildComparisonPoint("revenue", "Receita", revenueNow, revenuePrev, true),
    leads: buildComparisonPoint("leads", "Leads", leadsNow, leadsPrev, true),
    conversion: buildComparisonPoint(
      "conversion",
      "Conversão",
      conversionNow,
      conversionPrev,
      true,
    ),
  };
}

async function getRankingsData() {
  const [financialMarketing, financial, leads, ownerConversion, staff] = await Promise.all([
    getFinancialMarketingPageData(),
    getFinancialDashboardPageData(),
    getLeadsForPeriod(
      new Date(new Date().getFullYear(), new Date().getMonth() - 2, 1).toISOString().slice(0, 10),
      new Date().toISOString().slice(0, 10),
    ),
    getOwnerConversionRows(),
    getStaffWithRole(),
  ]);
  const byDimension = buildConversionBreakdowns(leads);
  return buildPerformanceRankings(
    financialMarketing,
    financial.revenueByClient,
    ownerConversion,
    { vendedor: byDimension.vendedor, canal: byDimension.canal, cidade: byDimension.cidade },
    staff,
  );
}

export async function getPerformanceExecutiveData(): Promise<PerformanceExecutiveData> {
  const [companyGoals, rankings, comparisons] = await Promise.all([
    getGoalsWithProgress("ativa"),
    getRankingsData(),
    getComparisons("mes"),
  ]);

  const empresaGoals = companyGoals.filter((g) => g.scopeType === "empresa");
  const withScore = empresaGoals.filter((g) => g.percentComplete !== null);
  const overallPercentComplete =
    withScore.length > 0
      ? withScore.reduce((sum, g) => sum + Math.min(g.percentComplete as number, 100), 0) /
        withScore.length
      : null;

  return {
    companyGoals: empresaGoals,
    overallPercentComplete,
    rankings,
    alerts: buildPerformanceAlerts(companyGoals),
    comparisons,
  };
}

const COMMERCIAL_TYPES = new Set([
  "leads",
  "leads_qualificados",
  "reunioes",
  "propostas",
  "vendas",
  "conversao",
  "tempo_primeiro_contato",
  "tempo_fechamento",
]);

export async function getPerformanceCommercialData(): Promise<PerformanceCommercialData> {
  const [allGoals, rankings] = await Promise.all([
    getGoalsWithProgress("ativa"),
    getRankingsData(),
  ]);
  const goals = allGoals.filter((g) => COMMERCIAL_TYPES.has(g.type));
  return { goals, topSellers: rankings.topSellers, alerts: buildPerformanceAlerts(goals) };
}

const FINANCIAL_TYPES = new Set([
  "receita",
  "ticket_medio",
  "cac",
  "roi",
  "roas",
  "receitas_recebidas",
  "parcelas_atraso",
]);

export async function getPerformanceFinancialData(): Promise<PerformanceFinancialData> {
  const allGoals = await getGoalsWithProgress("ativa");
  const goals = allGoals.filter((g) => FINANCIAL_TYPES.has(g.type));
  return { goals, alerts: buildPerformanceAlerts(goals) };
}

export async function getPerformanceMarketingData(): Promise<PerformanceMarketingData> {
  const [allGoals, rankings] = await Promise.all([
    getGoalsWithProgress("ativa"),
    getRankingsData(),
  ]);
  const goals = allGoals.filter(
    (g) =>
      g.scopeType === "campanha" ||
      g.scopeType === "canal" ||
      g.scopeType === "origem" ||
      g.type === "conversao",
  );
  return {
    goals,
    topCampaigns: rankings.topCampaigns,
    topChannels: rankings.topChannels,
    alerts: buildPerformanceAlerts(goals),
  };
}

function buildScorecard(
  scopeType: GoalScopeType,
  scopeRef: string | null,
  scopeLabel: string,
  goals: GoalWithProgress[],
): Scorecard {
  const achieved = goals.filter((g) => isAchieved(g.progressStatus)).length;
  const pending = goals.length - achieved;
  const withScore = goals.filter((g) => g.percentComplete !== null);
  const percentComplete =
    withScore.length > 0
      ? withScore.reduce((sum, g) => sum + Math.min(g.percentComplete as number, 100), 0) /
        withScore.length
      : null;

  const revenueGoal = goals.find((g) => g.type === "receita");
  const conversionGoal = goals.find((g) => g.type === "conversao");

  return {
    scopeType,
    scopeRef,
    scopeLabel,
    goalsAchieved: achieved,
    goalsPending: pending,
    percentComplete,
    revenueGenerated: revenueGoal?.actualValue ?? 0,
    conversionRate: conversionGoal?.actualValue ?? null,
    goals,
    history: goals.map((g) => ({
      key: g.id,
      label: `${GOAL_TYPE_META[g.type].label} (${g.periodStart.slice(0, 7)})`,
      actualValue: g.actualValue,
      targetValue: g.targetValue,
    })),
  };
}

export async function getPerformanceTeamData(): Promise<PerformanceTeamData> {
  const allGoals = await getGoalsWithProgress("ativa");
  const teamGoals = allGoals.filter((g) => g.scopeType === "equipe");
  const roles = [
    ...new Set(teamGoals.map((g) => g.scopeRef).filter((r): r is string => r !== null)),
  ];

  const scorecards = roles.map((role) =>
    buildScorecard(
      "equipe",
      role,
      STAFF_ROLE_LABEL[role as StaffRole] ?? role,
      teamGoals.filter((g) => g.scopeRef === role),
    ),
  );

  return { scorecards };
}

export async function getPerformanceIndividualData(
  selectedOwnerId?: string,
): Promise<PerformanceIndividualData> {
  const [staff, allGoals] = await Promise.all([getStaffWithRole(), getGoalsWithProgress("ativa")]);
  const owners = staff.map((s) => ({ id: s.id, name: s.name, email: s.email }));
  const ownerId = selectedOwnerId ?? owners[0]?.id ?? null;
  if (!ownerId) return { owners, selectedOwnerId: null, scorecard: null };

  const userGoals = allGoals.filter((g) => g.scopeType === "usuario" && g.scopeRef === ownerId);
  const owner = staff.find((s) => s.id === ownerId);
  const scorecard = buildScorecard(
    "usuario",
    ownerId,
    owner?.name ?? owner?.email ?? "—",
    userGoals,
  );

  return { owners, selectedOwnerId: ownerId, scorecard };
}

/** Leve — só staff, sem calcular progresso de nenhuma meta — usada pelo
 * layout de /performance (todas as abas precisam disso para o
 * GoalEditorModal, mesmo as que não listam metas). */
export async function getPerformanceScopeOptions(): Promise<
  PerformanceGoalsPageData["scopeOptions"]
> {
  const staff = await getStaffWithRole();
  return {
    empresa: [],
    equipe: staff
      .map((s) => s.role)
      .filter((role, index, arr) => arr.indexOf(role) === index)
      .map((role) => ({ value: role, label: STAFF_ROLE_LABEL[role as StaffRole] ?? role })),
    usuario: staff.map((s) => ({ value: s.id, label: s.name ?? s.email ?? s.id })),
    campanha: [],
    canal: [],
    cidade: [],
    origem: Object.entries(MARKETING_ORIGIN_LABEL).map(([value, label]) => ({ value, label })),
    pipeline: [],
    projeto: [],
  };
}

export async function getPerformanceGoalsPageData(): Promise<PerformanceGoalsPageData> {
  const [activeGoals, archivedGoals, scopeOptions] = await Promise.all([
    getGoalsForStatus("ativa"),
    getGoalsForStatus("arquivada"),
    getPerformanceScopeOptions(),
  ]);

  const goals = await computeGoalsWithProgress([...activeGoals, ...archivedGoals]);

  return { goals, scopeOptions };
}

export async function createPerformanceGoal(payload: CreateGoalPayload): Promise<PerformanceGoal> {
  const supabase = await getSupabaseAuthClient();
  return createGoalRow(supabase, payload);
}

export async function updatePerformanceGoal(id: string, patch: UpdateGoalPayload): Promise<void> {
  const supabase = await getSupabaseAuthClient();
  return updateGoalRow(supabase, id, patch);
}

export async function archivePerformanceGoal(id: string): Promise<void> {
  const supabase = await getSupabaseAuthClient();
  return archiveGoalRow(supabase, id);
}
