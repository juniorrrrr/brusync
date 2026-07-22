import { formatPercent } from "@/domain/crm/format";
import type { StageConversion } from "@/repositories/crm/dashboardRepository";

export function StageConversionPanel({ stages }: { stages: StageConversion[] }) {
  const max = Math.max(...stages.map((s) => s.enteredCount), 1);

  return (
    <div className="crm-card crm-card-pad reveal in">
      <div className="crm-card-head">
        <div>
          <div className="crm-card-title">Conversão entre etapas</div>
          <div className="crm-card-sub">Quantos leads já passaram por cada estágio do funil</div>
        </div>
      </div>
      <div style={{ marginTop: 8 }}>
        {stages.map(({ stage, enteredCount, conversionFromPrevious }) => (
          <div key={stage.id} className="crm-funnel-row">
            <span className="crm-funnel-label">{stage.label}</span>
            <span className="crm-funnel-track">
              <span
                className="crm-funnel-fill"
                style={{ width: `${Math.max(4, (enteredCount / max) * 100)}%` }}
              />
            </span>
            <span className="crm-funnel-count">
              {enteredCount}
              {conversionFromPrevious !== null && (
                <span className="cell-muted" style={{ marginLeft: 6, fontSize: 11 }}>
                  ({formatPercent(conversionFromPrevious)})
                </span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
