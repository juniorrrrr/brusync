/** Builds an SVG polyline path (compatible with LineChart's `d` prop, a
 * 300-wide viewBox) from an arbitrary number of data points — used to turn
 * "leads per day, last 14 days" into the dashboard's mini performance chart
 * without hardcoding a fixed point count. */
export function buildSparklinePath(values: number[], height = 90, padding = 6): string {
  if (values.length === 0) return `M0 ${height} L300 ${height}`;
  if (values.length === 1) return `M0 ${height / 2} L300 ${height / 2}`;

  const max = Math.max(...values, 1);
  const usableHeight = height - padding * 2;
  const stepX = 300 / (values.length - 1);

  const points = values.map((value, index) => {
    const x = Math.round(index * stepX);
    const y = Math.round(height - padding - (value / max) * usableHeight);
    return `${index === 0 ? "M" : "L"}${x} ${y}`;
  });

  return points.join(" ");
}
