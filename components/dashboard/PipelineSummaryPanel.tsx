import Link from "next/link";
import type { StageCount } from "@/repositories/crm/dashboardRepository";

export function PipelineSummaryPanel({ stageCounts }: { stageCounts: StageCount[] }) {
  const max = Math.max(...stageCounts.map((s) => s.count), 1);

  return (
    <div className="crm-card crm-card-pad reveal in">
      <div className="crm-card-head">
        <div>
          <div className="crm-card-title">Pipeline resumido</div>
          <div className="crm-card-sub">Leads por estágio do funil</div>
        </div>
      </div>
      <div style={{ marginTop: 8 }}>
        {stageCounts.map(({ stage, count }) => (
          <Link key={stage.id} href={`/leads?stage=${stage.id}`} className="crm-funnel-row">
            <span className="crm-funnel-label">{stage.label}</span>
            <span className="crm-funnel-track">
              <span
                className="crm-funnel-fill"
                style={{ width: `${Math.max(4, (count / max) * 100)}%` }}
              />
            </span>
            <span className="crm-funnel-count">{count}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
