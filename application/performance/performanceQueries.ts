import "server-only";

import { requireCrmProfile } from "@/application/crm/authGuard";
import {
  getPerformanceCommercialData,
  getPerformanceExecutiveData,
  getPerformanceFinancialData,
  getPerformanceGoalsPageData,
  getPerformanceIndividualData,
  getPerformanceMarketingData,
  getPerformanceScopeOptions,
  getPerformanceTeamData,
} from "@/services/performance/performanceService";
import type {
  GoalScopeOption,
  GoalScopeType,
  PerformanceCommercialData,
  PerformanceExecutiveData,
  PerformanceFinancialData,
  PerformanceGoalsPageData,
  PerformanceIndividualData,
  PerformanceMarketingData,
  PerformanceTeamData,
} from "@/types/performance";

/** Wrappers finos, um por aba de /performance — guard de sessão (defesa em
 * profundidade, mesmo padrão de application/revenueIntelligence/*) e delega
 * para services/performance/performanceService.ts, que já é 100% ciente de
 * Modo Demonstração. */

export async function fetchPerformanceExecutiveData(): Promise<PerformanceExecutiveData> {
  await requireCrmProfile();
  return getPerformanceExecutiveData();
}

export async function fetchPerformanceCommercialData(): Promise<PerformanceCommercialData> {
  await requireCrmProfile();
  return getPerformanceCommercialData();
}

export async function fetchPerformanceFinancialData(): Promise<PerformanceFinancialData> {
  await requireCrmProfile();
  return getPerformanceFinancialData();
}

export async function fetchPerformanceMarketingData(): Promise<PerformanceMarketingData> {
  await requireCrmProfile();
  return getPerformanceMarketingData();
}

export async function fetchPerformanceTeamData(): Promise<PerformanceTeamData> {
  await requireCrmProfile();
  return getPerformanceTeamData();
}

export async function fetchPerformanceIndividualData(
  ownerId?: string,
): Promise<PerformanceIndividualData> {
  await requireCrmProfile();
  return getPerformanceIndividualData(ownerId);
}

export async function fetchPerformanceGoalsPageData(): Promise<PerformanceGoalsPageData> {
  await requireCrmProfile();
  return getPerformanceGoalsPageData();
}

export async function fetchPerformanceScopeOptions(): Promise<
  Record<GoalScopeType, GoalScopeOption[]>
> {
  await requireCrmProfile();
  return getPerformanceScopeOptions();
}
