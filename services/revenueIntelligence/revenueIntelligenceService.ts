import "server-only";

import { getDashboardData } from "@/application/crm/dashboardQueries";
import { getLeadsPageData, getPipelineData } from "@/application/crm/leadsQueries";
import { getFinancialDashboardPageData } from "@/application/financial/financialDashboardQueries";
import { getFinancialMarketingPageData } from "@/application/financial/financialMarketingQueries";
import { fetchIntelligenceDashboardData } from "@/application/intelligence/intelligenceDashboardQueries";
import { getCampaignRows } from "@/application/marketingAnalytics/campaignsQueries";
import { getMarketingDataset } from "@/application/marketingAnalytics/dataset";
import { getProjectsHealthData } from "@/application/projects/projectsHealthQueries";
import type { FinancialLedgerRow } from "@/domain/financial/calculations";
import type { OwnerConversion } from "@/domain/intelligence/dataset";
import {
  buildConversionBreakdowns,
  buildStageCycle,
} from "@/domain/revenueIntelligence/conversionBreakdown";
import {
  buildRevenueFinancialKpis,
  computeLtv,
} from "@/domain/revenueIntelligence/financialIntelligence";
import {
  buildRevenueForecastSummary,
  computePipelineForecast,
  computeStageWinProbabilities,
  estimateForecastByPeriod,
  sumLostRevenue,
} from "@/domain/revenueIntelligence/forecast";
import { buildRevenueHeatmaps } from "@/domain/revenueIntelligence/heatmaps";
import {
  buildRevenueInsights,
  computeConversionOutliers,
} from "@/domain/revenueIntelligence/insights";
import { buildRevenueRankings } from "@/domain/revenueIntelligence/rankings";
import { buildDemoLedgerRows } from "@/lib/demo/mockFinancial";
import { getDemoOwnerConversion } from "@/lib/demo/mockIntelligence";
import { DEMO_ENRICHED_LEADS } from "@/lib/demo/mockMarketing";
import { getDemoClientsWithoutContact } from "@/lib/demo/mockRevenueIntelligence";
import { listLedgerRows } from "@/repositories/financial/transactionsRepository";
import { getOwnerConversion } from "@/repositories/intelligence/crossModuleRepository";
import { listClientsWithoutRecentContact } from "@/repositories/revenueIntelligence/clientContactRepository";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type {
  ConversionAnalysisData,
  RevenueAlertsData,
  RevenueFinancialData,
  RevenueForecastData,
  RevenueHeatmapsData,
  RevenueLeadRow,
  RevenueRankings,
} from "@/types/revenueIntelligence";

/** As 6 funções abaixo espelham as 6 abas de /receita — cada uma busca só o
 * que a sua própria aba precisa (mesmo padrão do módulo Marketing, que já
 * tem várias abas independentes), em vez de um único agregador que carrega
 * tudo de uma vez (esse segundo padrão só faz sentido para uma dashboard de
 * página única, como Central de Inteligência/Central de Operações). Nenhuma
 * delas faz uma query nova além de listClientsWithoutRecentContact — todo o
 * resto é Promise.all de funções application/* já existentes. */

async function getRevenueLeadRows(): Promise<RevenueLeadRow[]> {
  if (await isDemoModeActive()) return DEMO_ENRICHED_LEADS;
  const { leads } = await getMarketingDataset();
  return leads;
}

async function getLedgerRowsForLtv(): Promise<FinancialLedgerRow[]> {
  if (await isDemoModeActive()) return buildDemoLedgerRows();
  const supabase = await getSupabaseAuthClient();
  return listLedgerRows(supabase);
}

async function getOwnerConversionRows(): Promise<OwnerConversion[]> {
  if (await isDemoModeActive()) return getDemoOwnerConversion();
  const supabase = await getSupabaseAuthClient();
  return getOwnerConversion(supabase);
}

const CLIENT_CONTACT_STALE_DAYS = 30;

async function getClientsWithoutContactRows() {
  if (await isDemoModeActive()) return getDemoClientsWithoutContact();
  const supabase = await getSupabaseAuthClient();
  return listClientsWithoutRecentContact(supabase, CLIENT_CONTACT_STALE_DAYS);
}

export async function getRevenueForecastData(): Promise<RevenueForecastData> {
  const [pipeline, lostPage, dashboard, financial] = await Promise.all([
    getPipelineData(),
    getLeadsPageData({ status: "perdido", limit: 10000 }),
    getDashboardData(),
    getFinancialDashboardPageData(),
  ]);

  const openLeads = pipeline.columns
    .flatMap((column) => column.leads)
    .filter((lead) => !lead.stage.isWon);
  const stages = lostPage.stages;
  const winProbabilities = computeStageWinProbabilities(
    stages,
    dashboard.stageConversion,
    dashboard.winLossSummary.winRate,
  );
  const { predictedRevenue, byStage } = computePipelineForecast(
    openLeads,
    stages,
    winProbabilities,
  );
  const lostRevenue = sumLostRevenue(lostPage.leads);
  const summary = buildRevenueForecastSummary(
    predictedRevenue,
    financial.receivedRevenue,
    lostRevenue,
    byStage,
  );
  const { monthly, quarterly, annual } = estimateForecastByPeriod(
    openLeads,
    winProbabilities,
    dashboard.kpis.averageTimeToWinDays,
  );

  return {
    summary,
    monthly,
    quarterly,
    annual,
    averageSalesCycleDays: dashboard.kpis.averageTimeToWinDays,
  };
}

export async function getRevenueCommercialData(): Promise<ConversionAnalysisData> {
  const [leads, dashboard, projectsHealth] = await Promise.all([
    getRevenueLeadRows(),
    getDashboardData(),
    getProjectsHealthData(),
  ]);

  return {
    byDimension: buildConversionBreakdowns(leads),
    stageCycle: buildStageCycle(dashboard.stageConversion, dashboard.stageAvgDuration),
    averageProjectDeliveryDays: projectsHealth.averageDeliveryDays,
  };
}

export async function getRevenueFinancialData(): Promise<RevenueFinancialData> {
  const [financial, financialMarketing, forecast, ledgerRows] = await Promise.all([
    getFinancialDashboardPageData(),
    getFinancialMarketingPageData(),
    getRevenueForecastData(),
    getLedgerRowsForLtv(),
  ]);

  const ltv = computeLtv(ledgerRows);
  const kpis = buildRevenueFinancialKpis(
    financialMarketing,
    ltv,
    financial.averageTicket,
    forecast.summary.predictedRevenue,
    forecast.summary.confirmedRevenue,
    forecast.summary.lostRevenue,
    financial.averageMargin,
  );

  return { kpis, monthlySeries: financial.monthlySeries };
}

export async function getRevenueRankingsData(): Promise<RevenueRankings> {
  const [financialMarketing, financial, leads, ownerConversion] = await Promise.all([
    getFinancialMarketingPageData(),
    getFinancialDashboardPageData(),
    getRevenueLeadRows(),
    getOwnerConversionRows(),
  ]);

  const byDimension = buildConversionBreakdowns(leads);
  return buildRevenueRankings(financialMarketing, financial.revenueByClient, ownerConversion, {
    vendedor: byDimension.vendedor,
    canal: byDimension.canal,
    cidade: byDimension.cidade,
  });
}

export async function getRevenueHeatmapsData(): Promise<RevenueHeatmapsData> {
  const leads = await getRevenueLeadRows();
  return buildRevenueHeatmaps(leads);
}

const ALERT_CATEGORIES = new Set(["comercial", "marketing", "financeiro"]);

export async function getRevenueAlertsData(): Promise<RevenueAlertsData> {
  const [intelligence, leads, campaignRowsResult, clientsWithoutContact] = await Promise.all([
    fetchIntelligenceDashboardData(),
    getRevenueLeadRows(),
    getCampaignRows({ pageSize: 100 }),
    getClientsWithoutContactRows(),
  ]);

  const byDimension = buildConversionBreakdowns(leads);
  const reusedAlerts = intelligence.alerts.filter((alert) => ALERT_CATEGORIES.has(alert.category));
  const conversionOutliers = computeConversionOutliers(byDimension.vendedor, byDimension.campanha);
  const insights = buildRevenueInsights(
    campaignRowsResult.rows,
    byDimension.canal,
    byDimension.origem,
    leads,
    intelligence.trends,
  );

  return { reusedAlerts, clientsWithoutContact, conversionOutliers, insights };
}
