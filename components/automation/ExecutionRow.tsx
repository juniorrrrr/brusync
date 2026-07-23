import {
  AUTOMATION_EXECUTION_STATUS_BADGE,
  AUTOMATION_EXECUTION_STATUS_LABEL,
  AUTOMATION_TRIGGER_LABEL,
} from "@/domain/automation/types";
import { formatDateTime } from "@/domain/crm/format";
import type { AutomationExecution } from "@/types/automation";

export function ExecutionRow({ execution }: { execution: AutomationExecution }) {
  return (
    <div className="crm-au-row">
      <div style={{ flex: 1 }}>
        <div
          style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}
        >
          <strong>{execution.workflowName ?? "Automação removida"}</strong>
          <span className="crm-card-sub" style={{ margin: 0 }}>
            {formatDateTime(execution.executedAt)}
          </span>
        </div>
        <div className="crm-au-desc">
          {AUTOMATION_TRIGGER_LABEL[execution.triggerType]}
          {execution.leadName ? ` · ${execution.leadName}` : ""}
          {` · ${execution.durationMs} ms`}
        </div>
        {execution.resultMessage && <div className="crm-au-desc">{execution.resultMessage}</div>}
      </div>
      <span className={`crm-badge ${AUTOMATION_EXECUTION_STATUS_BADGE[execution.status]}`}>
        {AUTOMATION_EXECUTION_STATUS_LABEL[execution.status]}
      </span>
    </div>
  );
}
