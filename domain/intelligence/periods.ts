import type { IntelligenceDateRange, IntelligencePeriodKey } from "@/types/intelligence";

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

/** Resolves a comparativo period key (+ optional custom bounds) into the
 * current range and the immediately-preceding range of equal length —
 * every trend delta in the engine (CAC subindo, ROAS caindo, ...) compares
 * exactly these two ranges, computed once here instead of scattered across
 * services. */
export function resolvePeriodRange(
  period: IntelligencePeriodKey,
  now: Date,
  custom?: IntelligenceDateRange,
): { range: IntelligenceDateRange; previousRange: IntelligenceDateRange } {
  const today = startOfDay(now);

  switch (period) {
    case "hoje": {
      const from = today;
      const to = endOfDay(now);
      const prevFrom = new Date(from.getTime() - DAY_MS);
      const prevTo = new Date(to.getTime() - DAY_MS);
      return toRanges(from, to, prevFrom, prevTo);
    }
    case "ontem": {
      const from = new Date(today.getTime() - DAY_MS);
      const to = new Date(endOfDay(now).getTime() - DAY_MS);
      const prevFrom = new Date(from.getTime() - DAY_MS);
      const prevTo = new Date(to.getTime() - DAY_MS);
      return toRanges(from, to, prevFrom, prevTo);
    }
    case "7d": {
      const from = new Date(today.getTime() - 6 * DAY_MS);
      const to = endOfDay(now);
      const prevFrom = new Date(from.getTime() - 7 * DAY_MS);
      const prevTo = new Date(from.getTime() - DAY_MS);
      return toRanges(from, to, prevFrom, prevTo);
    }
    case "30d": {
      const from = new Date(today.getTime() - 29 * DAY_MS);
      const to = endOfDay(now);
      const prevFrom = new Date(from.getTime() - 30 * DAY_MS);
      const prevTo = new Date(from.getTime() - DAY_MS);
      return toRanges(from, to, prevFrom, prevTo);
    }
    case "mes_atual": {
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      const to = endOfDay(now);
      const prevFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prevTo = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return toRanges(from, to, prevFrom, prevTo);
    }
    case "mes_anterior": {
      const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const to = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      const prevFrom = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      const prevTo = new Date(now.getFullYear(), now.getMonth() - 1, 0, 23, 59, 59, 999);
      return toRanges(from, to, prevFrom, prevTo);
    }
    case "ano": {
      const from = new Date(now.getFullYear(), 0, 1);
      const to = endOfDay(now);
      const prevFrom = new Date(now.getFullYear() - 1, 0, 1);
      const prevTo = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
      return toRanges(from, to, prevFrom, prevTo);
    }
    case "personalizado": {
      if (!custom) throw new Error("Período personalizado exige um intervalo de datas.");
      const from = new Date(custom.from);
      const to = new Date(custom.to);
      const spanMs = Math.max(to.getTime() - from.getTime(), DAY_MS);
      const prevTo = new Date(from.getTime() - DAY_MS);
      const prevFrom = new Date(prevTo.getTime() - spanMs);
      return toRanges(from, to, prevFrom, prevTo);
    }
    default:
      return resolvePeriodRange("30d", now, custom);
  }
}

function toRanges(from: Date, to: Date, prevFrom: Date, prevTo: Date) {
  return {
    range: { from: from.toISOString(), to: to.toISOString() },
    previousRange: { from: prevFrom.toISOString(), to: prevTo.toISOString() },
  };
}

export const INTELLIGENCE_PERIOD_LABEL: Record<IntelligencePeriodKey, string> = {
  hoje: "Hoje",
  ontem: "Ontem",
  "7d": "Últimos 7 dias",
  "30d": "Últimos 30 dias",
  mes_atual: "Mês atual",
  mes_anterior: "Mês anterior",
  ano: "Ano",
  personalizado: "Período personalizado",
};

export const INTELLIGENCE_PERIODS: IntelligencePeriodKey[] = [
  "hoje",
  "ontem",
  "7d",
  "30d",
  "mes_atual",
  "mes_anterior",
  "ano",
  "personalizado",
];
