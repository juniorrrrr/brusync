import type { Metric } from "@/types/marketing";

export function knownMetric(value: number): Metric {
  return { value, available: true };
}

export const UNAVAILABLE_METRIC: Metric = { value: null, available: false };

/** ROAS = receita / investimento. Sem investimento lançado, o resultado é
 * "indisponível" — nunca um ROAS de zero ou infinito fabricado. */
export function computeRoas(revenue: number, investment: Metric): Metric {
  if (!investment.available || investment.value === null || investment.value <= 0) {
    return UNAVAILABLE_METRIC;
  }
  return knownMetric(revenue / investment.value);
}

/** ROI em % = (receita - investimento) / investimento * 100. */
export function computeRoi(revenue: number, investment: Metric): Metric {
  if (!investment.available || investment.value === null || investment.value <= 0) {
    return UNAVAILABLE_METRIC;
  }
  return knownMetric(((revenue - investment.value) / investment.value) * 100);
}

/** CAC = investimento / clientes conquistados no período/escopo. */
export function computeCac(clientsCount: number, investment: Metric): Metric {
  if (!investment.available || investment.value === null || clientsCount <= 0) {
    return UNAVAILABLE_METRIC;
  }
  return knownMetric(investment.value / clientsCount);
}

export function sumInvestment(entries: Metric[]): Metric {
  const known = entries.filter((entry) => entry.available && entry.value !== null);
  if (known.length === 0) return UNAVAILABLE_METRIC;
  return knownMetric(known.reduce((sum, entry) => sum + (entry.value ?? 0), 0));
}
