import "server-only";

import { listRecentActivities } from "@/repositories/crm/activitiesRepository";
import { countClients, countClientsSince } from "@/repositories/crm/clientsRepository";
import {
  countLeadsSince,
  countWonLeadsSince,
  getAveragePotentialValue,
  getDailyLeadCounts,
  getLeadsGroupedByOrigin,
  getLeadsGroupedByStage,
  listAwaitingContactLeads,
  type OriginCount,
  type StageCount,
} from "@/repositories/crm/dashboardRepository";
import {
  countMaterialDownloadsSince,
  listRecentMaterialDownloads,
} from "@/repositories/crm/marketingRepository";
import { listUpcomingTasksAcrossLeads } from "@/repositories/crm/tasksRepository";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type { CrmLeadWithRelations } from "@/types/crm";

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
}

function startOfMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

export interface DashboardData {
  kpis: {
    leadsToday: number;
    leadsThisMonth: number;
    conversionRate: number;
    averagePotentialValue: number | null;
    activeClients: number;
    newClientsThisMonth: number;
    downloadsThisMonth: number;
  };
  stageCounts: StageCount[];
  originCounts: OriginCount[];
  dailyLeadCounts: { date: string; count: number }[];
  awaitingContact: CrmLeadWithRelations[];
  recentActivities: Awaited<ReturnType<typeof listRecentActivities>>;
  upcomingTasks: Awaited<ReturnType<typeof listUpcomingTasksAcrossLeads>>;
  recentDownloads: Awaited<ReturnType<typeof listRecentMaterialDownloads>>;
}

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = await getSupabaseAuthClient();
  const todayIso = startOfToday();
  const monthIso = startOfMonth();

  const [
    leadsToday,
    leadsThisMonth,
    wonThisMonth,
    averagePotentialValue,
    activeClients,
    newClientsThisMonth,
    stageCounts,
    originCounts,
    dailyLeadCounts,
    awaitingContact,
    recentActivities,
    upcomingTasks,
    recentDownloads,
    downloadsThisMonth,
  ] = await Promise.all([
    countLeadsSince(supabase, todayIso),
    countLeadsSince(supabase, monthIso),
    countWonLeadsSince(supabase, monthIso),
    getAveragePotentialValue(supabase),
    countClients(supabase, "ativo"),
    countClientsSince(supabase, monthIso),
    getLeadsGroupedByStage(supabase),
    getLeadsGroupedByOrigin(supabase),
    getDailyLeadCounts(supabase, 14),
    listAwaitingContactLeads(supabase, 6),
    listRecentActivities(supabase, 8),
    listUpcomingTasksAcrossLeads(supabase, 6),
    listRecentMaterialDownloads(supabase, 6),
    countMaterialDownloadsSince(supabase, monthIso),
  ]);

  const conversionRate = leadsThisMonth > 0 ? (wonThisMonth / leadsThisMonth) * 100 : 0;

  return {
    kpis: {
      leadsToday,
      leadsThisMonth,
      conversionRate,
      averagePotentialValue,
      activeClients,
      newClientsThisMonth,
      downloadsThisMonth,
    },
    stageCounts,
    originCounts,
    dailyLeadCounts,
    awaitingContact,
    recentActivities,
    upcomingTasks,
    recentDownloads,
  };
}
