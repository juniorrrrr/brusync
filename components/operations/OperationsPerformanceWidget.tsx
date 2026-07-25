import Link from "next/link";
import type { OperationsPerformanceSnapshot } from "@/types/operations";

export function OperationsPerformanceWidget({
  snapshot,
}: {
  snapshot: OperationsPerformanceSnapshot;
}) {
  return (
    <div className="crm-card crm-card-pad reveal in">
      <div className="crm-card-head">
        <div>
          <div className="crm-card-title">Metas e performance</div>
        </div>
        <Link href="/performance" className="btn btn-outline">
          Ver performance
        </Link>
      </div>
      <div className="crm-info-list" style={{ marginTop: 8 }}>
        <div className="crm-info-row">
          <span className="crm-info-row-label">Metas ativas</span>
          <span className="crm-info-row-value">{snapshot.activeGoals}</span>
        </div>
        <div className="crm-info-row">
          <span className="crm-info-row-label">Metas atingidas</span>
          <span className="crm-info-row-value">{snapshot.achievedGoals}</span>
        </div>
        <div className="crm-info-row">
          <span className="crm-info-row-label">Metas em risco</span>
          <span className="crm-info-row-value">{snapshot.atRiskGoals}</span>
        </div>
        <div className="crm-info-row">
          <span className="crm-info-row-label">% concluído</span>
          <span className="crm-info-row-value">
            {snapshot.overallPercentComplete !== null
              ? `${snapshot.overallPercentComplete.toFixed(0)}%`
              : "—"}
          </span>
        </div>
      </div>
    </div>
  );
}
