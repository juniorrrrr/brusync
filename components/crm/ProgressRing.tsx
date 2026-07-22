import { SCORE_TONE } from "@/domain/crm/leadRules";

const TONE_COLOR: Record<string, string> = {
  ok: "var(--ok)",
  warn: "var(--warn)",
  danger: "var(--danger)",
};

/** Small SVG circular progress ring for the lead score (0-100). Hand-built —
 * a plain strokeDasharray circle, not worth spending a scarce 21st.dev daily
 * retrieval on. */
export function ProgressRing({ value, size = 40 }: { value: number; size?: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  const strokeWidth = size * 0.11;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);
  const color = TONE_COLOR[SCORE_TONE(clamped)];

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--border)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 0.4s ease" }}
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        style={{ fontSize: size * 0.32, fontWeight: 800, fill: "var(--primary)" }}
      >
        {clamped}
      </text>
    </svg>
  );
}
