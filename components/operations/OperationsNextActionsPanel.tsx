import Link from "next/link";
import { operationsPriorityBadge } from "@/domain/operations/types";
import type { OperationsNextAction } from "@/types/operations";

const PRIORITY_LABEL: Record<OperationsNextAction["priority"], string> = {
  alta: "Alta",
  media: "Média",
  baixa: "Baixa",
};

export function OperationsNextActionsPanel({ actions }: { actions: OperationsNextAction[] }) {
  return (
    <div className="crm-card crm-card-pad reveal in">
      <div className="crm-card-head">
        <div>
          <div className="crm-card-title">Próximas ações</div>
          <div className="crm-card-sub">Sugestões priorizadas a partir da sua fila</div>
        </div>
      </div>
      {actions.length === 0 ? (
        <p className="crm-card-sub" style={{ marginTop: 12 }}>
          Nenhuma ação sugerida no momento.
        </p>
      ) : (
        <div className="crm-mini-list">
          {actions.slice(0, 10).map((action) => (
            <Link key={action.id} href={action.href} className="crm-mini-row">
              <span className="crm-mini-ico">•</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="crm-mini-title">{action.title}</div>
                <div className="crm-mini-meta">{action.reason}</div>
              </div>
              <span
                className={`crm-badge ${operationsPriorityBadge(action.priority)}`}
                style={{ fontSize: 10 }}
              >
                {PRIORITY_LABEL[action.priority]}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
