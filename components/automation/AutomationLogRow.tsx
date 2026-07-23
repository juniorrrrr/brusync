import { AUTOMATION_LOG_LEVEL_LABEL } from "@/domain/automation/types";
import { formatDateTime } from "@/domain/crm/format";
import type { AutomationLogEntry } from "@/types/automation";

export function AutomationLogRow({ log }: { log: AutomationLogEntry }) {
  const leadName =
    log.metadata && typeof log.metadata.leadName === "string" ? log.metadata.leadName : null;

  return (
    <div className="crm-au-log-row">
      <span
        className={`crm-au-log-dot ${log.level === "erro" ? "erro" : log.level === "aviso" ? "condicao_nao_atendida" : "sucesso"}`}
      />
      <div style={{ flex: 1 }}>
        <div
          style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}
        >
          <strong>{log.workflowName ?? "Automação removida"}</strong>
          <span className="crm-card-sub" style={{ margin: 0 }}>
            {formatDateTime(log.createdAt)}
          </span>
        </div>
        <div className="crm-card-sub" style={{ marginTop: 2 }}>
          {AUTOMATION_LOG_LEVEL_LABEL[log.level]}
          {leadName ? ` · ${leadName}` : ""}
        </div>
        <div className="crm-au-desc">{log.message}</div>
      </div>
    </div>
  );
}
