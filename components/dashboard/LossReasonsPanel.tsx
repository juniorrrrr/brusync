import type { LossReasonCount } from "@/repositories/crm/dashboardRepository";

export function LossReasonsPanel({ reasons }: { reasons: LossReasonCount[] }) {
  const total = reasons.reduce((sum, r) => sum + r.count, 0);
  const max = Math.max(...reasons.map((r) => r.count), 1);

  return (
    <div className="crm-card crm-card-pad reveal in">
      <div className="crm-card-head">
        <div>
          <div className="crm-card-title">Motivos de perda</div>
          <div className="crm-card-sub">
            {total} lead{total === 1 ? "" : "s"} perdido{total === 1 ? "" : "s"} no total
          </div>
        </div>
      </div>
      <div style={{ marginTop: 8 }}>
        {reasons.map(({ reason, label, count }) => (
          <div key={reason} className="crm-funnel-row">
            <span className="crm-funnel-label">{label}</span>
            <span className="crm-funnel-track">
              <span
                className="crm-funnel-fill"
                style={{ width: `${count === 0 ? 0 : Math.max(4, (count / max) * 100)}%` }}
              />
            </span>
            <span className="crm-funnel-count">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
