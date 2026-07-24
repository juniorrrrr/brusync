import "server-only";

import { getAutomationHealthData } from "@/application/automation/automationHealthQueries";
import { getConversionsHealthData } from "@/application/conversions/conversionHealthQueries";
import { getDashboardData } from "@/application/crm/dashboardQueries";
import { getFinancialDashboardPageData } from "@/application/financial/financialDashboardQueries";
import { getIntegrationHealthData } from "@/application/integrations/integrationHealthQueries";
import { getCampaignRows } from "@/application/marketingAnalytics/campaignsQueries";
import { getExecutiveMetrics } from "@/application/marketingAnalytics/executiveQueries";
import { getOriginMetrics } from "@/application/marketingAnalytics/originsQueries";
import { getProjectsHealthData } from "@/application/projects/projectsHealthQueries";
import type { OperationalDataset } from "@/domain/intelligence/dataset";
import { resolvePeriodRange } from "@/domain/intelligence/periods";
import { INTELLIGENCE_THRESHOLDS } from "@/domain/intelligence/thresholds";
import {
  getDemoAverageResponseMinutes,
  getDemoDelinquentClients,
  getDemoNeverContactedLeads,
  getDemoOverdueProjects,
  getDemoOwnerConversion,
  getDemoPreviousExecutiveMetrics,
  getDemoScoreHistory,
  getDemoStaleLeads,
  getDemoStorageBytes,
} from "@/lib/demo/mockIntelligence";
import { getDemoProjects } from "@/lib/demo/mockProjects";
import * as crossModuleRepo from "@/repositories/intelligence/crossModuleRepository";
import * as scoresRepo from "@/repositories/intelligence/scoresRepository";
import * as snapshotsRepo from "@/repositories/intelligence/snapshotsRepository";
import { listProjects } from "@/repositories/projects/projectsRepository";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type { IntelligenceDateRange, IntelligencePeriodKey } from "@/types/intelligence";

const SCORE_HISTORY_DAYS = 30;

export async function buildOperationalDataset(
  period: IntelligencePeriodKey,
  custom?: IntelligenceDateRange,
): Promise<OperationalDataset> {
  const now = new Date();
  const { range, previousRange } = resolvePeriodRange(period, now, custom);
  const demo = await isDemoModeActive();

  const [
    crmCurrent,
    marketingCurrent,
    marketingPreviousRaw,
    campaigns,
    origins,
    financialCurrent,
    projectsHealth,
    integrations,
    automation,
    conversions,
  ] = await Promise.all([
    getDashboardData(),
    getExecutiveMetrics({ createdFrom: range.from, createdTo: range.to }),
    getExecutiveMetrics({ createdFrom: previousRange.from, createdTo: previousRange.to }),
    getCampaignRows({ createdFrom: range.from, createdTo: range.to, pageSize: 100 }),
    getOriginMetrics({ createdFrom: range.from, createdTo: range.to }),
    getFinancialDashboardPageData(),
    getProjectsHealthData(),
    getIntegrationHealthData(),
    getAutomationHealthData(),
    getConversionsHealthData(),
  ]);

  const staleDays = INTELLIGENCE_THRESHOLDS.leads_parados.staleDays;
  const marketingPrevious = demo
    ? getDemoPreviousExecutiveMetrics(marketingCurrent)
    : marketingPreviousRaw;

  let staleLeads: Awaited<ReturnType<typeof crossModuleRepo.listStaleLeads>>;
  let neverContactedLeads: Awaited<ReturnType<typeof crossModuleRepo.listNeverContactedLeads>>;
  let ownerConversion: Awaited<ReturnType<typeof crossModuleRepo.getOwnerConversion>>;
  let daysSinceLastStageChange: number | null;
  let delinquentClients: Awaited<ReturnType<typeof crossModuleRepo.listDelinquentClients>>;
  let overdueProjects: Awaited<ReturnType<typeof crossModuleRepo.listOverdueProjects>>;
  let allActiveProjects: Awaited<ReturnType<typeof listProjects>>["projects"];
  let averageResponseMinutes: number | null;
  let previousAverageResponseMinutes: number | null;
  let storageBytes: number;
  let scoreHistory: Record<string, { date: string; score: number }[]>;
  let previousOverdueAmount: number | null;
  let previousRevenue: number | null;

  if (demo) {
    staleLeads = getDemoStaleLeads(staleDays);
    neverContactedLeads = getDemoNeverContactedLeads();
    ownerConversion = getDemoOwnerConversion();
    daysSinceLastStageChange = 1;
    delinquentClients = getDemoDelinquentClients();
    overdueProjects = getDemoOverdueProjects();
    allActiveProjects = getDemoProjects().projects;
    averageResponseMinutes = getDemoAverageResponseMinutes();
    previousAverageResponseMinutes = averageResponseMinutes * 0.85;
    storageBytes = getDemoStorageBytes();
    scoreHistory = getDemoScoreHistory();
    previousOverdueAmount = financialCurrent.overdueAmount * 0.82;
    previousRevenue = financialCurrent.monthRevenue * 0.91;
  } else {
    const supabase = await getSupabaseAuthClient();
    const sinceDate = new Date(now.getTime() - SCORE_HISTORY_DAYS * 86_400_000)
      .toISOString()
      .slice(0, 10);
    const previousSnapshotDate = previousRange.to.slice(0, 10);

    const [
      staleLeadsResult,
      neverContactedResult,
      ownerConversionResult,
      daysSinceStageResult,
      delinquentResult,
      overdueProjectsResult,
      allProjectsResult,
      avgResponseResult,
      prevAvgResponseResult,
      storageResult,
      scoreHistoryResult,
      previousSnapshotResult,
    ] = await Promise.all([
      crossModuleRepo.listStaleLeads(supabase, staleDays),
      crossModuleRepo.listNeverContactedLeads(supabase),
      crossModuleRepo.getOwnerConversion(supabase),
      crossModuleRepo.getDaysSinceLastStageChange(supabase),
      crossModuleRepo.listDelinquentClients(supabase),
      crossModuleRepo.listOverdueProjects(supabase),
      listProjects(supabase, { limit: 200 }),
      crossModuleRepo.getAverageResponseMinutes(supabase, range.from, range.to),
      crossModuleRepo.getAverageResponseMinutes(supabase, previousRange.from, previousRange.to),
      crossModuleRepo.getTotalStorageBytes(supabase),
      scoresRepo.listAllScoreHistory(supabase, sinceDate),
      snapshotsRepo.getLatestSnapshotBefore(supabase, previousSnapshotDate),
    ]);

    staleLeads = staleLeadsResult;
    neverContactedLeads = neverContactedResult;
    ownerConversion = ownerConversionResult;
    daysSinceLastStageChange = daysSinceStageResult;
    delinquentClients = delinquentResult;
    overdueProjects = overdueProjectsResult;
    allActiveProjects = allProjectsResult.projects;
    averageResponseMinutes = avgResponseResult;
    previousAverageResponseMinutes = prevAvgResponseResult;
    storageBytes = storageResult;
    scoreHistory = scoreHistoryResult;

    const prevSnapshot = previousSnapshotResult as {
      overdueAmount?: number;
      monthRevenue?: number;
    } | null;
    previousOverdueAmount = prevSnapshot?.overdueAmount ?? null;
    previousRevenue = prevSnapshot?.monthRevenue ?? null;
  }

  return {
    range,
    previousRange,
    generatedAt: now.toISOString(),
    crm: {
      current: crmCurrent,
      staleLeads,
      neverContactedLeads,
      ownerConversion,
      daysSinceLastStageChange,
    },
    marketing: {
      current: marketingCurrent,
      previous: marketingPrevious,
      campaigns: campaigns.rows,
      origins,
    },
    financial: {
      current: financialCurrent,
      previousOverdueAmount,
      previousRevenue,
      delinquentClients,
      recentAverageRevenue: previousRevenue,
    },
    projects: {
      health: projectsHealth,
      overdue: overdueProjects,
      allActive: allActiveProjects,
    },
    communication: {
      averageResponseMinutes,
      previousAverageResponseMinutes,
    },
    integrations,
    automation,
    conversions,
    storage: { totalBytes: storageBytes },
    scoreHistory,
  };
}
