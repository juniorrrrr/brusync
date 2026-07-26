import { formatMetricValue } from "@/domain/analytics/metricsCatalog";
import { ANALYTICS_CHART_COLORS } from "@/domain/analytics/statusMeta";
import type { AnalyticsMetricUnit, AnalyticsSeriesPoint } from "@/types/analytics";

const WIDTH = 320;
const HEIGHT = 160;
const PADDING = 24;

function colorAt(index: number): string {
  return ANALYTICS_CHART_COLORS[index % ANALYTICS_CHART_COLORS.length];
}

function BarLikeChart({
  points,
  unit,
  horizontal = false,
}: {
  points: AnalyticsSeriesPoint[];
  unit: AnalyticsMetricUnit;
  horizontal?: boolean;
}) {
  const max = Math.max(...points.map((p) => p.value), 1);
  return (
    <div className="crm-an-bars">
      {points.map((point, index) => (
        <div key={point.label} className={`crm-an-bar-row${horizontal ? " horizontal" : ""}`}>
          <span className="crm-an-bar-label">{point.label}</span>
          <div className="crm-an-bar-track">
            <div
              className="crm-an-bar-fill"
              style={{ width: `${(point.value / max) * 100}%`, background: colorAt(index) }}
            />
          </div>
          <span className="crm-an-bar-value">{formatMetricValue(point.value, unit)}</span>
        </div>
      ))}
    </div>
  );
}

function LineAreaChart({ points, filled }: { points: AnalyticsSeriesPoint[]; filled: boolean }) {
  const max = Math.max(...points.map((p) => p.value), 1);
  const stepX = points.length > 1 ? (WIDTH - PADDING * 2) / (points.length - 1) : 0;
  const coords = points.map((point, index) => {
    const x = PADDING + index * stepX;
    const y = HEIGHT - PADDING - (point.value / max) * (HEIGHT - PADDING * 2);
    return { x, y };
  });
  const linePath = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x},${c.y}`).join(" ");
  const areaPath = `${linePath} L${coords[coords.length - 1]?.x ?? PADDING},${HEIGHT - PADDING} L${PADDING},${HEIGHT - PADDING} Z`;

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="crm-an-svg"
      preserveAspectRatio="none"
      role="img"
    >
      <title>{filled ? "Gráfico de área" : "Gráfico de linha"}</title>
      {filled && <path d={areaPath} fill="var(--accent)" opacity={0.18} />}
      <path d={linePath} fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinecap="round" />
      {coords.map((c, index) => (
        <circle key={points[index].label} cx={c.x} cy={c.y} r={3} fill="var(--accent)" />
      ))}
    </svg>
  );
}

function PieChart({ points, unit }: { points: AnalyticsSeriesPoint[]; unit: AnalyticsMetricUnit }) {
  const total = points.reduce((sum, p) => sum + p.value, 0) || 1;
  let cumulative = 0;
  const stops = points.map((point, index) => {
    const start = (cumulative / total) * 360;
    cumulative += point.value;
    const end = (cumulative / total) * 360;
    return `${colorAt(index)} ${start}deg ${end}deg`;
  });

  return (
    <div className="crm-an-pie-wrap">
      <div className="crm-an-pie" style={{ background: `conic-gradient(${stops.join(", ")})` }} />
      <div className="crm-an-legend">
        {points.map((point, index) => (
          <div key={point.label} className="crm-an-legend-item">
            <span className="crm-an-legend-dot" style={{ background: colorAt(index) }} />
            <span>{point.label}</span>
            <strong>{formatMetricValue(point.value, unit)}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function RadarChart({ points }: { points: AnalyticsSeriesPoint[] }) {
  const max = Math.max(...points.map((p) => p.value), 1);
  const cx = WIDTH / 2;
  const cy = HEIGHT / 2;
  const radius = Math.min(WIDTH, HEIGHT) / 2 - PADDING;
  const angleStep = (2 * Math.PI) / Math.max(points.length, 1);

  const coords = points.map((point, index) => {
    const angle = angleStep * index - Math.PI / 2;
    const r = (point.value / max) * radius;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  });
  const polygon = coords.map((c) => `${c.x},${c.y}`).join(" ");

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="crm-an-svg" role="img">
      <title>Gráfico radar</title>
      <polygon
        points={polygon}
        fill="var(--accent)"
        opacity={0.25}
        stroke="var(--accent)"
        strokeWidth={2}
      />
      {coords.map((c, index) => (
        <circle key={points[index].label} cx={c.x} cy={c.y} r={3} fill="var(--accent)" />
      ))}
    </svg>
  );
}

export function SeriesChart({
  variant,
  points,
  unit,
}: {
  variant: "linha" | "barras" | "area" | "pizza" | "radar" | "funil" | "ranking";
  points: AnalyticsSeriesPoint[];
  unit: AnalyticsMetricUnit;
}) {
  if (points.length === 0) {
    return <p className="crm-card-sub">Sem dados para exibir.</p>;
  }

  switch (variant) {
    case "linha":
      return <LineAreaChart points={points} filled={false} />;
    case "area":
      return <LineAreaChart points={points} filled />;
    case "pizza":
      return <PieChart points={points} unit={unit} />;
    case "radar":
      return <RadarChart points={points} />;
    case "funil":
      return <BarLikeChart points={[...points].sort((a, b) => b.value - a.value)} unit={unit} />;
    case "ranking":
      return (
        <BarLikeChart
          points={[...points].sort((a, b) => b.value - a.value)}
          unit={unit}
          horizontal
        />
      );
    default:
      return <BarLikeChart points={points} unit={unit} />;
  }
}
