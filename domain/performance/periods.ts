import type { ComparisonPeriodKey, GoalPeriodType } from "@/types/performance";

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function startOfWeek(date: Date): Date {
  const day = date.getDay();
  const diffToMonday = (day + 6) % 7;
  return startOfDay(new Date(date.getTime() - diffToMonday * DAY_MS));
}

function startOfQuarter(date: Date): Date {
  const quarter = Math.floor(date.getMonth() / 3);
  return new Date(date.getFullYear(), quarter * 3, 1);
}

function startOfHalfYear(date: Date): Date {
  const half = date.getMonth() < 6 ? 0 : 6;
  return new Date(date.getFullYear(), half, 1);
}

type CalendarUnit = "dia" | "semana" | "mes" | "trimestre" | "semestre" | "ano";

/** Início/fim do período CORRENTE que contém `date`, para cada unidade de
 * calendário usada tanto pelo default de período de meta quanto pelos
 * Comparativos — mesmo algoritmo de domain/intelligence/periods.ts, só que
 * com o conjunto de unidades que esta fase precisa (inclui trimestre e
 * semestre, que a Fase 19 não tinha). */
function rangeForUnit(unit: CalendarUnit, date: Date): { start: Date; end: Date } {
  switch (unit) {
    case "dia":
      return { start: startOfDay(date), end: endOfDay(date) };
    case "semana": {
      const start = startOfWeek(date);
      return { start, end: endOfDay(new Date(start.getTime() + 6 * DAY_MS)) };
    }
    case "mes":
      return {
        start: new Date(date.getFullYear(), date.getMonth(), 1),
        end: new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999),
      };
    case "trimestre": {
      const start = startOfQuarter(date);
      return {
        start,
        end: new Date(start.getFullYear(), start.getMonth() + 3, 0, 23, 59, 59, 999),
      };
    }
    case "semestre": {
      const start = startOfHalfYear(date);
      return {
        start,
        end: new Date(start.getFullYear(), start.getMonth() + 6, 0, 23, 59, 59, 999),
      };
    }
    case "ano":
      return {
        start: new Date(date.getFullYear(), 0, 1),
        end: new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999),
      };
  }
}

/** Mesmo range, um "passo" (da própria unidade) antes — usado só pelos
 * Comparativos ("mesmo período anterior"), nunca pelo default de meta. */
function previousRangeForUnit(unit: CalendarUnit, date: Date): { start: Date; end: Date } {
  switch (unit) {
    case "dia":
      return rangeForUnit("dia", new Date(date.getTime() - DAY_MS));
    case "semana":
      return rangeForUnit("semana", new Date(date.getTime() - 7 * DAY_MS));
    case "mes":
      return rangeForUnit("mes", new Date(date.getFullYear(), date.getMonth() - 1, 1));
    case "trimestre":
      return rangeForUnit("trimestre", new Date(date.getFullYear(), date.getMonth() - 3, 1));
    case "semestre":
      return rangeForUnit("semestre", new Date(date.getFullYear(), date.getMonth() - 6, 1));
    case "ano":
      return rangeForUnit("ano", new Date(date.getFullYear() - 1, 0, 1));
  }
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Preenche o período de uma meta nova com o padrão do tipo escolhido — o
 * usuário pode sempre sobrescrever period_start/period_end antes de salvar,
 * isso só evita ter que digitar as duas datas manualmente no caso comum. */
export function resolveGoalPeriodDefault(
  periodType: GoalPeriodType,
  referenceDate: Date,
): { periodStart: string; periodEnd: string } {
  if (periodType === "personalizado") {
    const today = startOfDay(referenceDate);
    return { periodStart: toIsoDate(today), periodEnd: toIsoDate(today) };
  }

  const unit: CalendarUnit =
    periodType === "diario"
      ? "dia"
      : periodType === "semanal"
        ? "semana"
        : periodType === "mensal"
          ? "mes"
          : periodType === "trimestral"
            ? "trimestre"
            : periodType === "semestral"
              ? "semestre"
              : "ano";

  const { start, end } = rangeForUnit(unit, referenceDate);
  return { periodStart: toIsoDate(start), periodEnd: toIsoDate(end) };
}

const COMPARISON_UNIT: Record<Exclude<ComparisonPeriodKey, "hoje" | "ontem">, CalendarUnit> = {
  semana: "semana",
  mes: "mes",
  trimestre: "trimestre",
  ano: "ano",
};

/** Range atual + "mesmo período anterior" para a aba de Comparativos —
 * mesma ideia de domain/intelligence/periods.ts::resolvePeriodRange, com o
 * conjunto de chaves pedido nesta fase (inclui trimestre, que a Fase 19 não
 * tinha) em vez de reaproveitar o tipo de lá. */
export function resolveComparisonRange(
  period: ComparisonPeriodKey,
  referenceDate: Date,
): { current: { from: string; to: string }; previous: { from: string; to: string } } {
  if (period === "hoje" || period === "ontem") {
    const base = period === "hoje" ? referenceDate : new Date(referenceDate.getTime() - DAY_MS);
    const current = rangeForUnit("dia", base);
    const previous = rangeForUnit("dia", new Date(base.getTime() - DAY_MS));
    return {
      current: { from: current.start.toISOString(), to: current.end.toISOString() },
      previous: { from: previous.start.toISOString(), to: previous.end.toISOString() },
    };
  }

  const unit = COMPARISON_UNIT[period];
  const current = rangeForUnit(unit, referenceDate);
  const previous = previousRangeForUnit(unit, referenceDate);
  return {
    current: { from: current.start.toISOString(), to: current.end.toISOString() },
    previous: { from: previous.start.toISOString(), to: previous.end.toISOString() },
  };
}

export const COMPARISON_PERIOD_LABEL: Record<ComparisonPeriodKey, string> = {
  hoje: "Hoje",
  ontem: "Ontem",
  semana: "Semana",
  mes: "Mês",
  trimestre: "Trimestre",
  ano: "Ano",
};

export const COMPARISON_PERIODS: ComparisonPeriodKey[] = [
  "hoje",
  "ontem",
  "semana",
  "mes",
  "trimestre",
  "ano",
];
