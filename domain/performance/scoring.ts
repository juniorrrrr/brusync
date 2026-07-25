import type { GoalDirection, GoalProgressStatus } from "@/types/performance";

/** "Quanto menor melhor" inverte a razão: bater ou ficar abaixo da meta já é
 * ≥100%, ficar acima dela degrada o percentual — mesma necessidade que já
 * levou o schema a ter a coluna `direction` (ver migration da Fase 23). */
export function computePercentComplete(
  actualValue: number | null,
  targetValue: number,
  direction: GoalDirection,
): number | null {
  if (actualValue === null || targetValue === 0) return null;
  if (direction === "maior_melhor") return (actualValue / targetValue) * 100;
  if (actualValue <= 0) return null;
  return (targetValue / actualValue) * 100;
}

const AT_RISK_PACE_GAP = 15;

/** Compara o quanto do prazo já passou com o quanto da meta já foi
 * concluído — "em risco" é quando o ritmo está atrasado em relação ao
 * tempo decorrido, não apenas um limite fixo de percentual. */
export function computeProgressStatus(
  percentComplete: number | null,
  periodStart: string,
  periodEnd: string,
  now: Date,
): GoalProgressStatus | null {
  if (percentComplete === null) return null;
  if (percentComplete >= 120) return "superada";
  if (percentComplete >= 100) return "atingida";
  if (percentComplete < 50) return "abaixo_50";

  const start = new Date(periodStart).getTime();
  const end = new Date(periodEnd).getTime();
  const total = Math.max(end - start, 1);
  const elapsed = Math.min(Math.max(now.getTime() - start, 0), total);
  const percentElapsed = (elapsed / total) * 100;

  if (percentElapsed - percentComplete >= AT_RISK_PACE_GAP) return "em_risco";
  return "no_prazo";
}

export const PROGRESS_STATUS_LABEL: Record<GoalProgressStatus, string> = {
  superada: "Superada",
  atingida: "Atingida",
  no_prazo: "No prazo",
  em_risco: "Em risco",
  abaixo_50: "Abaixo de 50%",
};

export const PROGRESS_STATUS_BADGE: Record<GoalProgressStatus, string> = {
  superada: "ok",
  atingida: "ok",
  no_prazo: "info",
  em_risco: "warn",
  abaixo_50: "danger",
};

export function isAchieved(status: GoalProgressStatus | null): boolean {
  return status === "atingida" || status === "superada";
}
