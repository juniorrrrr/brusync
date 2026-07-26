import "server-only";

import { requireCrmProfile } from "@/application/crm/authGuard";
import {
  getProcessCategories,
  getProcessDashboardData,
  getProcessDetail,
  getProcessesPageData,
  getProcessFormOptions,
  getProcessTemplates,
  type ProcessFormOptions,
} from "@/services/processes/processesService";
import type {
  ProcessCategory,
  ProcessDashboardData,
  ProcessDetail,
  ProcessesPageData,
  ProcessListFilters,
  ProcessTemplate,
} from "@/types/processes";

/** Wrappers finos — guard de sessão (defesa em profundidade, mesmo padrão de
 * application/performance/performanceQueries.ts) delegando para
 * services/processes/processesService.ts, que já é 100% ciente de Modo
 * Demonstração. */

export async function fetchProcessDashboardData(): Promise<ProcessDashboardData> {
  await requireCrmProfile();
  return getProcessDashboardData();
}

export async function fetchProcessesPageData(
  filters: ProcessListFilters = {},
): Promise<ProcessesPageData> {
  await requireCrmProfile();
  return getProcessesPageData(filters);
}

export async function fetchProcessDetail(id: string): Promise<ProcessDetail | null> {
  await requireCrmProfile();
  return getProcessDetail(id);
}

export async function fetchProcessCategories(): Promise<ProcessCategory[]> {
  await requireCrmProfile();
  return getProcessCategories();
}

export async function fetchProcessTemplates(): Promise<ProcessTemplate[]> {
  await requireCrmProfile();
  return getProcessTemplates();
}

export async function fetchProcessFormOptions(): Promise<ProcessFormOptions> {
  await requireCrmProfile();
  return getProcessFormOptions();
}
