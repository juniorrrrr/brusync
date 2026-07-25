import "server-only";

import { DEFAULT_OPERATIONS_LAYOUT, mergeLayoutWithCatalog } from "@/domain/operations/widgets";
import { isAchieved } from "@/domain/performance/scoring";
import { DEMO_CURRENT_USER_ID } from "@/lib/demo/mockOperations";
import * as favoritesRepo from "@/repositories/operations/favoritesRepository";
import * as layoutsRepo from "@/repositories/operations/layoutsRepository";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { computeOperationsCards } from "@/services/operations/operationsCardsService";
import { buildOperationsData } from "@/services/operations/operationsDataService";
import {
  computeOperationsFeed,
  computeOperationsTimeline,
} from "@/services/operations/operationsFeedService";
import { computeOperationsModuleHealth } from "@/services/operations/operationsHealthService";
import {
  computeOperationsNextActions,
  computeOperationsQueue,
} from "@/services/operations/operationsQueueService";
import { getPerformanceExecutiveData } from "@/services/performance/performanceService";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type { IntelligencePeriodKey } from "@/types/intelligence";
import type { OperationsDashboardData } from "@/types/operations";

export async function buildOperationsDashboard(
  profileId: string,
  period: IntelligencePeriodKey = "hoje",
): Promise<OperationsDashboardData> {
  const demo = await isDemoModeActive();
  const [data, performance] = await Promise.all([
    buildOperationsData(period),
    getPerformanceExecutiveData(),
  ]);

  const [favorites, savedLayout] = demo
    ? [[], null]
    : await (async () => {
        const supabase = await getSupabaseAuthClient();
        return Promise.all([
          favoritesRepo.listFavoritesForUser(supabase, profileId),
          layoutsRepo.getLayoutForUser(supabase, profileId),
        ]);
      })();

  // Demo fixtures have no way to know the real logged-in user's id — "Minha
  // fila" would always render empty otherwise. In Modo Demonstração it's
  // computed against the same fixed demo persona (Camila Rocha) every other
  // module's mock data already centers around, never the real profile id.
  const queueOwnerId = demo ? DEMO_CURRENT_USER_ID : profileId;
  const queue = computeOperationsQueue(data, queueOwnerId);

  const nowMs = data.now.getTime();
  const newInsights = data.intelligence.insights.filter(
    (i) => nowMs - new Date(i.createdAt).getTime() <= 24 * 3_600_000,
  );

  return {
    cards: computeOperationsCards(data),
    feed: computeOperationsFeed(data),
    timeline: computeOperationsTimeline(data),
    queue,
    nextActions: computeOperationsNextActions(queue),
    moduleHealth: computeOperationsModuleHealth(data),
    favorites,
    criticalAlerts: data.intelligence.alerts.filter((a) => a.severity === "critico"),
    newInsights,
    agendaToday: data.agendaToday,
    financialSnapshot: {
      expectedRevenue: data.financial.expectedRevenue,
      receivedRevenue: data.financial.receivedRevenue,
      overdueAmount: data.financial.overdueAmount,
      monthRevenue: data.financial.monthRevenue,
    },
    marketingSnapshot: {
      conversionRate: data.crm.kpis.conversionRate,
      roas: data.intelligence.trends.find((t) => t.key === "roas")?.currentValue ?? null,
      cac: data.intelligence.trends.find((t) => t.key === "cac")?.currentValue ?? null,
      leadsCount: data.crm.kpis.leadsThisMonth,
    },
    projectsSnapshot: {
      active: data.projectsHealth.activeProjects,
      completed: data.projectsHealth.completedProjects,
      overdue: data.projectsHealth.overdueProjects,
      dueSoon: data.projectsDueSoon.length,
    },
    performanceSnapshot: {
      activeGoals: performance.companyGoals.length,
      achievedGoals: performance.companyGoals.filter((g) => isAchieved(g.progressStatus)).length,
      atRiskGoals: performance.companyGoals.filter(
        (g) => g.progressStatus === "em_risco" || g.progressStatus === "abaixo_50",
      ).length,
      overallPercentComplete: performance.overallPercentComplete,
    },
    layout: savedLayout ? mergeLayoutWithCatalog(savedLayout) : DEFAULT_OPERATIONS_LAYOUT,
  };
}
