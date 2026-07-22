import type { MarketingPeriodPreset } from "@/types/marketing";

export const PERIOD_LABEL: Record<MarketingPeriodPreset, string> = {
  hoje: "Hoje",
  "7d": "7 dias",
  "30d": "30 dias",
  "90d": "90 dias",
  "12m": "12 meses",
};

export const PERIOD_OPTIONS: MarketingPeriodPreset[] = ["hoje", "7d", "30d", "90d", "12m"];

export interface DateRange {
  from: Date;
  to: Date;
}

export function resolvePeriodPreset(preset: MarketingPeriodPreset, now = new Date()): DateRange {
  const to = new Date(now);
  const from = new Date(now);
  from.setHours(0, 0, 0, 0);

  switch (preset) {
    case "hoje":
      break;
    case "7d":
      from.setDate(from.getDate() - 6);
      break;
    case "30d":
      from.setDate(from.getDate() - 29);
      break;
    case "90d":
      from.setDate(from.getDate() - 89);
      break;
    case "12m":
      from.setMonth(from.getMonth() - 12);
      break;
  }
  return { from, to };
}

/** The immediately-preceding period of equal length, used to compute the %
 * change shown next to each KPI ("Comparativos"). */
export function previousPeriod({ from, to }: DateRange): DateRange {
  const durationMs = to.getTime() - from.getTime();
  return { from: new Date(from.getTime() - durationMs), to: new Date(from.getTime()) };
}

/** Returns null when there's no baseline to compare against (previous period
 * was zero) — the UI shows "sem comparação" instead of a fake ±∞%. */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}
