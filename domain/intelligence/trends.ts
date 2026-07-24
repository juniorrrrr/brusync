import type { OperationalDataset } from "@/domain/intelligence/dataset";
import type { IntelligenceTrend, IntelligenceTrendDirection } from "@/types/intelligence";

const STABLE_BAND_PERCENT = 2;

/** Percent change from previous -> current, null when previous is zero
 * (division by zero has no meaningful percent — the caller falls back to
 * showing the absolute values instead). */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

function directionFromChange(changePercent: number | null): IntelligenceTrendDirection {
  if (changePercent === null) return "estavel";
  if (changePercent > STABLE_BAND_PERCENT) return "subindo";
  if (changePercent < -STABLE_BAND_PERCENT) return "descendo";
  return "estavel";
}

/** Builds one IntelligenceTrend entry. `higherIsBetter` encodes the
 * metric's own polarity (receita: true, CAC: false, ...) — this is the
 * single place that decides whether "subindo"/"descendo" is good or bad
 * news, so every caller (rules, scoring, the Tendências screen) agrees. */
export function buildTrend(params: {
  key: string;
  label: string;
  currentValue: number;
  previousValue: number;
  unit: string;
  higherIsBetter: boolean;
}): IntelligenceTrend {
  const changePercent = percentChange(params.currentValue, params.previousValue);
  const direction = directionFromChange(changePercent);
  const favorable =
    direction === "estavel"
      ? true
      : direction === "subindo"
        ? params.higherIsBetter
        : !params.higherIsBetter;

  return {
    key: params.key,
    label: params.label,
    direction,
    favorable,
    currentValue: params.currentValue,
    previousValue: params.previousValue,
    changePercent,
    unit: params.unit,
  };
}

/** The "Tendências" screen — receita, conversão, CAC, ROAS, volume de leads
 * e tempo médio de venda, cada um comparando o período atual ao anterior
 * via buildTrend, sempre com a mesma polaridade (higherIsBetter) decidida
 * aqui uma única vez. */
export function generateTrendList(dataset: OperationalDataset): IntelligenceTrend[] {
  const { marketing, crm, financial } = dataset;
  const trends: IntelligenceTrend[] = [
    buildTrend({
      key: "receita",
      label: "Receita",
      currentValue: financial.current.monthRevenue,
      previousValue: financial.previousRevenue ?? financial.current.monthRevenue,
      unit: "R$",
      higherIsBetter: true,
    }),
    buildTrend({
      key: "conversao",
      label: "Taxa de conversão",
      currentValue: marketing.current.conversionRate,
      previousValue: marketing.previous.conversionRate,
      unit: "%",
      higherIsBetter: true,
    }),
    buildTrend({
      key: "cac",
      label: "CAC",
      currentValue: marketing.current.cac.value ?? 0,
      previousValue: marketing.previous.cac.value ?? 0,
      unit: "R$",
      higherIsBetter: false,
    }),
    buildTrend({
      key: "roas",
      label: "ROAS",
      currentValue: marketing.current.roas.value ?? 0,
      previousValue: marketing.previous.roas.value ?? 0,
      unit: "x",
      higherIsBetter: true,
    }),
    buildTrend({
      key: "volume_leads",
      label: "Volume de leads",
      currentValue: marketing.current.leadsCount,
      previousValue: marketing.previous.leadsCount,
      unit: "leads",
      higherIsBetter: true,
    }),
  ];

  if (crm.current.kpis.averageTimeToWinDays !== null) {
    trends.push(
      buildTrend({
        key: "tempo_medio_venda",
        label: "Tempo médio de venda",
        currentValue: crm.current.kpis.averageTimeToWinDays,
        previousValue: crm.current.kpis.averageTimeToWinDays,
        unit: "dias",
        higherIsBetter: false,
      }),
    );
  }

  return trends;
}
