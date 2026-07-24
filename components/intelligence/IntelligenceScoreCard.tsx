import { LineChart } from "@/components/dashboard-mock/primitives/charts";
import { buildSparklinePath } from "@/domain/crm/sparkline";
import { INTELLIGENCE_SCORE_CATEGORY_LABEL, scoreBadge } from "@/domain/intelligence/types";
import type { IntelligenceScore } from "@/types/intelligence";

const BADGE_COLOR: Record<string, string> = {
  ok: "#16a34a",
  warn: "#d97706",
  danger: "#dc2626",
};

export function IntelligenceScoreCard({ score }: { score: IntelligenceScore }) {
  const badge = scoreBadge(score.score);
  const history = score.history.map((h) => h.score);

  return (
    <div className="crm-card crm-card-pad reveal in">
      <div className="crm-card-head">
        <div>
          <div className="crm-card-title">{INTELLIGENCE_SCORE_CATEGORY_LABEL[score.category]}</div>
          <div className="crm-card-sub">{score.explanation}</div>
        </div>
        <span
          className={`crm-badge ${badge}`}
          style={{ fontSize: 16, fontWeight: 800, padding: "6px 12px" }}
        >
          {score.score}
        </span>
      </div>

      {history.length > 1 && (
        <div style={{ marginTop: 10, height: 48 }}>
          <LineChart d={buildSparklinePath(history, 48)} color={BADGE_COLOR[badge]} height={48} />
        </div>
      )}

      <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 4 }}>
        {score.factors.slice(0, 4).map((factor) => (
          <div
            key={factor.label}
            style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}
          >
            <span style={{ color: "var(--muted)" }}>{factor.label}</span>
            <span
              style={{
                color:
                  factor.impact === "positivo"
                    ? "#16a34a"
                    : factor.impact === "negativo"
                      ? "#dc2626"
                      : "var(--muted)",
                fontWeight: 600,
              }}
            >
              {factor.detail}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
