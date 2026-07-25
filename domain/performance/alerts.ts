import { formatGoalValue, GOAL_TYPE_META } from "@/domain/performance/goalTypes";
import { PROGRESS_STATUS_LABEL } from "@/domain/performance/scoring";
import type { GoalProgressStatus, GoalWithProgress, PerformanceAlert } from "@/types/performance";

function severityFor(status: GoalProgressStatus): "info" | "atencao" | "critico" {
  if (status === "abaixo_50") return "critico";
  if (status === "em_risco") return "atencao";
  return "info";
}

function buildDescription(
  status: GoalProgressStatus,
  label: string,
  actualLabel: string,
  targetLabel: string,
): string {
  switch (status) {
    case "superada":
      return `${label} superou a meta: ${actualLabel} contra um alvo de ${targetLabel}.`;
    case "atingida":
      return `${label} atingiu a meta: ${actualLabel} contra um alvo de ${targetLabel}.`;
    case "em_risco":
      return `${label} está em risco de não bater a meta no prazo: ${actualLabel} até agora, alvo de ${targetLabel}.`;
    case "abaixo_50":
      return `${label} está abaixo de 50% da meta: ${actualLabel} contra um alvo de ${targetLabel}.`;
    default:
      return "";
  }
}

/** Alertas de meta são calculados em memória a cada carregamento — nenhuma
 * tabela nova (mesmo princípio de domain/revenueIntelligence/insights.ts).
 * "no_prazo" é o estado neutro e não gera alerta; metas arquivadas também
 * não geram alerta. */
export function buildPerformanceAlerts(goals: GoalWithProgress[]): PerformanceAlert[] {
  const alerts: PerformanceAlert[] = [];

  for (const goal of goals) {
    if (goal.status !== "ativa" || goal.progressStatus === null) continue;
    if (goal.progressStatus === "no_prazo") continue;

    const meta = GOAL_TYPE_META[goal.type];
    const actualLabel =
      goal.actualValue !== null ? formatGoalValue(goal.actualValue, meta.unit) : "—";
    const targetLabel = formatGoalValue(goal.targetValue, meta.unit);

    alerts.push({
      id: `${goal.id}-${goal.progressStatus}`,
      goalId: goal.id,
      goalType: goal.type,
      title: `${meta.label} (${goal.scopeLabel}): ${PROGRESS_STATUS_LABEL[goal.progressStatus]}`,
      description: buildDescription(goal.progressStatus, meta.label, actualLabel, targetLabel),
      severity: severityFor(goal.progressStatus),
      evidence: [
        { label: "Realizado", value: actualLabel },
        { label: "Meta", value: targetLabel },
        {
          label: "Percentual concluído",
          value: goal.percentComplete !== null ? `${goal.percentComplete.toFixed(1)}%` : "—",
        },
      ],
    });
  }

  return alerts;
}
