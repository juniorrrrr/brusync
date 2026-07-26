import type { AnalyticsPeriodKey } from "@/types/analytics";

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}
function toIso(date: Date): string {
  return date.toISOString();
}

export interface AnalyticsRange {
  from: string;
  to: string;
}

export interface AnalyticsResolvedPeriod {
  current: AnalyticsRange;
  previous: AnalyticsRange;
}

/** Mesmo princípio de domain/performance/periods.ts::resolveComparisonRange
 * (Fase 23) — aritmética de calendário pura, sem nenhuma regra de negócio —
 * só que com o conjunto exato de opções pedido pela Fase 27 (inclui "mês
 * anterior"/"ano anterior" como período PRINCIPAL selecionável, não só como
 * o lado "anterior" de uma comparação). */
export function resolveAnalyticsPeriod(
  key: AnalyticsPeriodKey,
  referenceDate: Date,
  custom?: { from: string; to: string } | null,
): AnalyticsResolvedPeriod {
  const now = referenceDate;

  switch (key) {
    case "hoje": {
      const current = { from: toIso(startOfDay(now)), to: toIso(endOfDay(now)) };
      const yesterday = new Date(now.getTime() - DAY_MS);
      return {
        current,
        previous: { from: toIso(startOfDay(yesterday)), to: toIso(endOfDay(yesterday)) },
      };
    }
    case "ontem": {
      const yesterday = new Date(now.getTime() - DAY_MS);
      const dayBefore = new Date(now.getTime() - 2 * DAY_MS);
      return {
        current: { from: toIso(startOfDay(yesterday)), to: toIso(endOfDay(yesterday)) },
        previous: { from: toIso(startOfDay(dayBefore)), to: toIso(endOfDay(dayBefore)) },
      };
    }
    case "ultimos_7_dias": {
      const from = new Date(now.getTime() - 7 * DAY_MS);
      const prevFrom = new Date(now.getTime() - 14 * DAY_MS);
      return {
        current: { from: toIso(startOfDay(from)), to: toIso(endOfDay(now)) },
        previous: { from: toIso(startOfDay(prevFrom)), to: toIso(endOfDay(from)) },
      };
    }
    case "ultimos_30_dias": {
      const from = new Date(now.getTime() - 30 * DAY_MS);
      const prevFrom = new Date(now.getTime() - 60 * DAY_MS);
      return {
        current: { from: toIso(startOfDay(from)), to: toIso(endOfDay(now)) },
        previous: { from: toIso(startOfDay(prevFrom)), to: toIso(endOfDay(from)) },
      };
    }
    case "mes_atual": {
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      const prevFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prevTo = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return {
        current: { from: toIso(from), to: toIso(to) },
        previous: { from: toIso(prevFrom), to: toIso(prevTo) },
      };
    }
    case "mes_anterior": {
      const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const to = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      const prevFrom = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      const prevTo = new Date(now.getFullYear(), now.getMonth() - 1, 0, 23, 59, 59, 999);
      return {
        current: { from: toIso(from), to: toIso(to) },
        previous: { from: toIso(prevFrom), to: toIso(prevTo) },
      };
    }
    case "ano_atual": {
      const from = new Date(now.getFullYear(), 0, 1);
      const to = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      const prevFrom = new Date(now.getFullYear() - 1, 0, 1);
      const prevTo = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
      return {
        current: { from: toIso(from), to: toIso(to) },
        previous: { from: toIso(prevFrom), to: toIso(prevTo) },
      };
    }
    case "ano_anterior": {
      const from = new Date(now.getFullYear() - 1, 0, 1);
      const to = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
      const prevFrom = new Date(now.getFullYear() - 2, 0, 1);
      const prevTo = new Date(now.getFullYear() - 2, 11, 31, 23, 59, 59, 999);
      return {
        current: { from: toIso(from), to: toIso(to) },
        previous: { from: toIso(prevFrom), to: toIso(prevTo) },
      };
    }
    case "personalizado": {
      if (!custom) {
        return {
          current: { from: toIso(startOfDay(now)), to: toIso(endOfDay(now)) },
          previous: { from: toIso(startOfDay(now)), to: toIso(endOfDay(now)) },
        };
      }
      const from = new Date(custom.from);
      const to = new Date(custom.to);
      const spanMs = Math.max(to.getTime() - from.getTime(), DAY_MS);
      const prevTo = new Date(from.getTime() - DAY_MS);
      const prevFrom = new Date(prevTo.getTime() - spanMs);
      return {
        current: { from: toIso(from), to: toIso(to) },
        previous: { from: toIso(prevFrom), to: toIso(prevTo) },
      };
    }
  }
}

export const ANALYTICS_PERIOD_LABEL: Record<AnalyticsPeriodKey, string> = {
  hoje: "Hoje",
  ontem: "Ontem",
  ultimos_7_dias: "Últimos 7 dias",
  ultimos_30_dias: "Últimos 30 dias",
  mes_atual: "Mês atual",
  mes_anterior: "Mês anterior",
  ano_atual: "Ano atual",
  ano_anterior: "Ano anterior",
  personalizado: "Período personalizado",
};

export const ANALYTICS_PERIODS: AnalyticsPeriodKey[] = [
  "hoje",
  "ontem",
  "ultimos_7_dias",
  "ultimos_30_dias",
  "mes_atual",
  "mes_anterior",
  "ano_atual",
  "ano_anterior",
  "personalizado",
];
