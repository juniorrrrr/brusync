import type { Metric } from "@/types/marketing";

/** Formats a Metric into the string MetricValue expects — called
 * server-side, never passed as a function prop across the RSC boundary. */
export function formatMetric(metric: Metric, formatter: (value: number) => string): string | null {
  return metric.available && metric.value !== null ? formatter(metric.value) : null;
}

export function formatRoas(value: number): string {
  return `${value.toFixed(2)}x`;
}

export function formatSignedPercent(value: number, digits = 1): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(digits)}%`;
}

export function formatDays(value: number): string {
  if (value < 1) return "< 1 dia";
  return `${value.toFixed(1)} dias`;
}

export function truncateUrl(url: string, maxLength = 42): string {
  const withoutProtocol = url.replace(/^https?:\/\//, "");
  if (withoutProtocol.length <= maxLength) return withoutProtocol;
  return `${withoutProtocol.slice(0, maxLength - 1)}…`;
}
