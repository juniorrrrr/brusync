import { useId } from "react";

export function LineChart({
  d,
  color,
  height = 92,
  fillOpacity = 0.35,
}: {
  d: string;
  color: string;
  height?: number;
  fillOpacity?: number;
}) {
  const gradientId = useId();
  const areaD = `${d} L300 ${height} L0 ${height} Z`;

  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 300 ${height}`}
      width="100%"
      height={height}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={fillOpacity} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#${gradientId})`} />
      <path
        className="chart-line"
        pathLength={1}
        d={d}
        fill="none"
        stroke={color}
        strokeWidth="2.2"
      />
    </svg>
  );
}

export function DonutChart({
  segments,
  size = 78,
}: {
  segments: { value: number; color: string }[];
  size?: number;
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;
  let offset = 25;
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 42 42"
      width={size}
      height={size}
      style={{ margin: "0 auto" }}
    >
      <circle cx="21" cy="21" r="15.9" fill="none" stroke="#EAF0F8" strokeWidth="6" />
      {segments.map((seg) => {
        const pct = (seg.value / total) * 100;
        const dash = `${pct} ${100 - pct}`;
        const el = (
          <circle
            key={seg.color}
            className="chart-donut"
            style={{ ["--seg" as string]: dash }}
            cx="21"
            cy="21"
            r="15.9"
            fill="none"
            stroke={seg.color}
            strokeWidth="6"
            strokeDasharray={dash}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        );
        offset -= pct;
        return el;
      })}
    </svg>
  );
}

export function BarChart({
  bars,
  height = 44,
}: {
  bars: { value: number; color: string; opacity?: number }[];
  height?: number;
}) {
  const max = Math.max(...bars.map((b) => b.value), 1);
  const width = bars.length * 20;
  const positioned = bars.map((bar, slot) => ({ ...bar, slot }));
  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      preserveAspectRatio="none"
    >
      {positioned.map((bar) => {
        const h = (bar.value / max) * (height - 4);
        return (
          <rect
            key={bar.slot}
            className="chart-bar"
            x={6 + bar.slot * 20}
            y={height - h}
            width="12"
            height={h}
            rx="2.5"
            fill={bar.color}
            opacity={bar.opacity ?? 1}
          />
        );
      })}
    </svg>
  );
}

export function Sparkline({ points, color }: { points: string; color: string }) {
  return (
    <svg
      aria-hidden="true"
      className="spark"
      viewBox="0 0 60 18"
      width="100%"
      height="18"
      preserveAspectRatio="none"
    >
      <polyline
        className="chart-line"
        pathLength={1}
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.6"
      />
    </svg>
  );
}
