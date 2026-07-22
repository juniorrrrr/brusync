import type { StageAvgDuration } from "@/repositories/crm/dashboardRepository";

function formatDays(days: number | null) {
  if (days === null) return "—";
  if (days < 1) return "< 1 dia";
  return `${days.toFixed(1)} dias`;
}

export function StageDurationPanel({ stages }: { stages: StageAvgDuration[] }) {
  const max = Math.max(...stages.map((s) => s.avgDays ?? 0), 1);

  return (
    <div className="crm-card crm-card-pad reveal in">
      <div className="crm-card-head">
        <div>
          <div className="crm-card-title">Tempo médio por estágio</div>
          <div className="crm-card-sub">Baseado em passagens já concluídas</div>
        </div>
      </div>
      <div style={{ marginTop: 8 }}>
        {stages.map(({ stage, avgDays }) => (
          <div key={stage.id} className="crm-funnel-row">
            <span className="crm-funnel-label">{stage.label}</span>
            <span className="crm-funnel-track">
              <span
                className="crm-funnel-fill"
                style={{ width: `${Math.max(4, ((avgDays ?? 0) / max) * 100)}%` }}
              />
            </span>
            <span className="crm-funnel-count">{formatDays(avgDays)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
