import type { PlaybookDashboardData, PlaybookSummary } from "@/types/playbooks";

export function buildPlaybookDashboardData(playbooks: PlaybookSummary[]): PlaybookDashboardData {
  const completedSteps = playbooks.reduce((sum, item) => sum + item.completedStepCount, 0);
  const pendingSteps = playbooks.reduce((sum, item) => sum + item.pendingStepCount, 0);
  const averageValues = playbooks
    .map((item) => item.averageStepMinutes)
    .filter((value): value is number => value !== null);

  return {
    activePlaybooks: playbooks.filter((item) => item.status === "ativo").length,
    reviewPlaybooks: playbooks.filter((item) => item.status === "em_revisao").length,
    completedSteps,
    pendingSteps,
    averageStepMinutes:
      averageValues.length > 0
        ? Math.round(averageValues.reduce((sum, value) => sum + value, 0) / averageValues.length)
        : null,
    mostUsedPlaybooks: [...playbooks]
      .sort((a, b) => b.executionCount - a.executionCount)
      .slice(0, 6),
    recentPlaybooks: [...playbooks]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, 6),
  };
}
