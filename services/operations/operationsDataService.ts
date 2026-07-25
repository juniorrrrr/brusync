import "server-only";

import { getAgendaHealthData } from "@/application/agenda/agendaHealthQueries";
import { getAgendaPageData } from "@/application/agenda/agendaQueries";
import { getAutomationHealthData } from "@/application/automation/automationHealthQueries";
import { getAutomationLogsPageData } from "@/application/automation/logsQueries";
import { getCommunicationInboxPageData } from "@/application/communication/communicationDashboardQueries";
import { getConversionsHealthData } from "@/application/conversions/conversionHealthQueries";
import { getConversionsPageData } from "@/application/conversions/conversionsQueries";
import { getDashboardData } from "@/application/crm/dashboardQueries";
import { getFinancialDashboardPageData } from "@/application/financial/financialDashboardQueries";
import { getIntegrationHealthData } from "@/application/integrations/integrationHealthQueries";
import { fetchIntelligenceDashboardData } from "@/application/intelligence/intelligenceDashboardQueries";
import { fetchKnowledgeRecentDocuments } from "@/application/knowledge/knowledgeFavoritesActions";
import { getProjectsHealthData } from "@/application/projects/projectsHealthQueries";
import { getDemoFinancialTransactions } from "@/lib/demo/mockFinancial";
import { getDemoProjects } from "@/lib/demo/mockProjects";
import { listTransactions } from "@/repositories/financial/transactionsRepository";
import * as timelineRepo from "@/repositories/operations/timelineRepository";
import { listProjects } from "@/repositories/projects/projectsRepository";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type { FinancialTransaction } from "@/types/financial";
import type { IntelligencePeriodKey } from "@/types/intelligence";
import type { Project } from "@/types/projects";

const DUE_SOON_DAYS = 7;
const RECENT_LIMIT = 20;

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

/** Everything Mission Control shows is fetched here, once, by calling the
 * SAME application-layer entry points every other dashboard already calls
 * (getDashboardData, getAgendaHealthData, getFinancialDashboardPageData,
 * getProjectsHealthData, getIntegrationHealthData, getAutomationHealthData,
 * getConversionsHealthData, getCommunicationInboxPageData,
 * fetchIntelligenceDashboardData, fetchKnowledgeRecentDocuments,
 * getAutomationLogsPageData, getConversionsPageData) — every one of them
 * already demo-aware, so Modo Demonstração falls out for free everywhere
 * except the handful of reads genuinely new to this module (projects due
 * soon, transactions due/paid, integration_events, overdue installments),
 * each branched explicitly below. */
export async function buildOperationsData(period: IntelligencePeriodKey = "hoje") {
  const now = new Date();
  const demo = await isDemoModeActive();

  const [
    crm,
    agendaHealth,
    agendaToday,
    financial,
    projectsHealth,
    integrations,
    automation,
    automationLogs,
    conversions,
    recentConversions,
    communication,
    intelligence,
    knowledgeRecent,
  ] = await Promise.all([
    getDashboardData(),
    getAgendaHealthData(),
    getAgendaPageData({
      scheduledFrom: startOfDay(now).toISOString(),
      scheduledTo: endOfDay(now).toISOString(),
    }),
    getFinancialDashboardPageData(),
    getProjectsHealthData(),
    getIntegrationHealthData(),
    getAutomationHealthData(),
    getAutomationLogsPageData({ limit: RECENT_LIMIT }),
    getConversionsHealthData(),
    getConversionsPageData({ limit: RECENT_LIMIT }),
    getCommunicationInboxPageData({}, null),
    fetchIntelligenceDashboardData(period),
    fetchKnowledgeRecentDocuments(RECENT_LIMIT),
  ]);

  let projectsDueSoon: Project[];
  let recentProjects: Project[];
  let transactionsDueToday: FinancialTransaction[];
  let recentPaidTransactions: FinancialTransaction[];
  let overdueInstallments: timelineRepo.OverdueInstallmentSummary;
  let recentEvents: Awaited<ReturnType<typeof timelineRepo.listRecentIntegrationEvents>>;

  const dueSoonTo = new Date(now.getTime() + DUE_SOON_DAYS * 86_400_000);

  if (demo) {
    const { projects } = getDemoProjects();
    recentProjects = projects;
    projectsDueSoon = projects.filter(
      (p) =>
        p.status !== "concluido" &&
        p.status !== "cancelado" &&
        p.dueAt &&
        new Date(p.dueAt) >= now &&
        new Date(p.dueAt) <= dueSoonTo,
    );
    const { transactions } = getDemoFinancialTransactions();
    transactionsDueToday = transactions.filter(
      (t) =>
        t.dueDate &&
        t.dueDate >= startOfDay(now).toISOString() &&
        t.dueDate <= endOfDay(now).toISOString() &&
        t.status !== "pago" &&
        t.status !== "cancelado",
    );
    recentPaidTransactions = transactions.filter((t) => t.status === "pago");
    overdueInstallments = { count: 3, amount: 4200 };
    recentEvents = [];
  } else {
    const supabase = await getSupabaseAuthClient();
    const [
      dueSoonResult,
      recentProjectsResult,
      dueTodayResult,
      paidResult,
      installmentsSummary,
      events,
    ] = await Promise.all([
      listProjects(supabase, {
        dueFrom: startOfDay(now).toISOString(),
        dueTo: dueSoonTo.toISOString(),
        limit: 50,
      }),
      listProjects(supabase, { limit: RECENT_LIMIT }),
      listTransactions(supabase, {
        dueFrom: startOfDay(now).toISOString(),
        dueTo: endOfDay(now).toISOString(),
        limit: 50,
      }),
      listTransactions(supabase, { status: "pago", limit: RECENT_LIMIT }),
      timelineRepo.getOverdueInstallmentsSummary(supabase),
      timelineRepo.listRecentIntegrationEvents(supabase, 40),
    ]);
    projectsDueSoon = dueSoonResult.projects.filter(
      (p) => p.status !== "concluido" && p.status !== "cancelado",
    );
    recentProjects = recentProjectsResult.projects;
    transactionsDueToday = dueTodayResult.transactions.filter(
      (t) => t.status !== "pago" && t.status !== "cancelado",
    );
    recentPaidTransactions = paidResult.transactions;
    overdueInstallments = installmentsSummary;
    recentEvents = events;
  }

  return {
    now,
    demo,
    crm,
    agendaHealth,
    agendaToday: agendaToday.events,
    financial,
    projectsHealth,
    projectsDueSoon,
    recentProjects,
    transactionsDueToday,
    recentPaidTransactions,
    overdueInstallments,
    integrations,
    automation,
    automationLogs: automationLogs.logs,
    conversions,
    recentConversions: recentConversions.events,
    communication: communication.conversations,
    intelligence,
    knowledgeRecent,
    recentEvents,
  };
}

export type OperationsData = Awaited<ReturnType<typeof buildOperationsData>>;
