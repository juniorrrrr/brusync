import { PROCESS_STATUSES } from "@/domain/processes/statusMeta";
import type {
  ProcessApproval,
  ProcessCategory,
  ProcessCategoryUsage,
  ProcessDashboardData,
  ProcessHistoryEntry,
  ProcessOwnerWorkload,
  ProcessSummary,
} from "@/types/processes";

/** Pura — recebe as listas já buscadas (reais ou de Modo Demonstração) e
 * agrega os números do Dashboard. Usada tanto por
 * services/processes/processesService.ts quanto por
 * lib/demo/mockProcesses.ts, para que o Dashboard de demonstração seja
 * sempre um recálculo dos mesmos ~15 processos fictícios, nunca números
 * hardcoded à parte. */
export function buildProcessDashboardData(
  processes: ProcessSummary[],
  categories: ProcessCategory[],
  recentHistory: ProcessHistoryEntry[],
  pendingApprovals: ProcessApproval[],
): ProcessDashboardData {
  const totalProcesses = processes.length;
  const activeProcesses = processes.filter((p) => p.status === "ativo").length;
  const completedProcesses = processes.filter((p) => p.status === "concluido").length;
  const pendingApprovalProcesses = processes.filter(
    (p) => p.status === "aguardando_aprovacao",
  ).length;
  const archivedProcesses = processes.filter((p) => p.status === "arquivado").length;

  const overallProgressPercent =
    totalProcesses === 0
      ? 0
      : Math.round(processes.reduce((sum, p) => sum + p.progressPercent, 0) / totalProcesses);

  const byCategory: ProcessCategoryUsage[] = categories
    .map((category) => {
      const inCategory = processes.filter((p) => p.categoryId === category.id);
      return {
        categoryId: category.id,
        categoryName: category.name,
        categoryColor: category.color,
        categoryIcon: category.icon,
        processCount: inCategory.length,
        completedCount: inCategory.filter((p) => p.status === "concluido").length,
      };
    })
    .filter((usage) => usage.processCount > 0)
    .sort((a, b) => b.processCount - a.processCount);

  const byStatus = PROCESS_STATUSES.map((status) => ({
    status,
    count: processes.filter((p) => p.status === status).length,
  })).filter((entry) => entry.count > 0);

  interface OwnerAccumulator {
    ownerId: string | null;
    ownerName: string | null;
    active: number;
    completed: number;
    progressSum: number;
    progressCount: number;
  }

  const ownerMap = new Map<string, OwnerAccumulator>();
  for (const process of processes) {
    if (process.status === "arquivado") continue;
    const key = process.ownerId ?? "sem-responsavel";
    const entry = ownerMap.get(key) ?? {
      ownerId: process.ownerId,
      ownerName: process.ownerName,
      active: 0,
      completed: 0,
      progressSum: 0,
      progressCount: 0,
    };
    if (process.status === "concluido") entry.completed += 1;
    else entry.active += 1;
    entry.progressSum += process.progressPercent;
    entry.progressCount += 1;
    ownerMap.set(key, entry);
  }

  const byOwner: ProcessOwnerWorkload[] = Array.from(ownerMap.values())
    .map((entry) => ({
      ownerId: entry.ownerId,
      ownerName: entry.ownerName,
      activeCount: entry.active,
      completedCount: entry.completed,
      progressPercent:
        entry.progressCount === 0 ? 0 : Math.round(entry.progressSum / entry.progressCount),
    }))
    .sort((a, b) => b.activeCount - a.activeCount);

  const recentProcesses = [...processes]
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
    .slice(0, 8);

  return {
    totalProcesses,
    activeProcesses,
    completedProcesses,
    pendingApprovalProcesses,
    archivedProcesses,
    overallProgressPercent,
    byCategory,
    byStatus,
    byOwner,
    recentProcesses,
    recentHistory,
    pendingApprovals,
  };
}
