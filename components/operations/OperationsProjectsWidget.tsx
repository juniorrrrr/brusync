import Link from "next/link";
import type { OperationsProjectsSnapshot } from "@/types/operations";

export function OperationsProjectsWidget({ snapshot }: { snapshot: OperationsProjectsSnapshot }) {
  return (
    <div className="crm-card crm-card-pad reveal in">
      <div className="crm-card-head">
        <div>
          <div className="crm-card-title">Saúde de projetos</div>
        </div>
        <Link href="/projetos" className="btn btn-outline">
          Ver projetos
        </Link>
      </div>
      <div className="crm-info-list" style={{ marginTop: 8 }}>
        <div className="crm-info-row">
          <span className="crm-info-row-label">Ativos</span>
          <span className="crm-info-row-value">{snapshot.active}</span>
        </div>
        <div className="crm-info-row">
          <span className="crm-info-row-label">Concluídos</span>
          <span className="crm-info-row-value">{snapshot.completed}</span>
        </div>
        <div className="crm-info-row">
          <span className="crm-info-row-label">Atrasados</span>
          <span className="crm-info-row-value">{snapshot.overdue}</span>
        </div>
        <div className="crm-info-row">
          <span className="crm-info-row-label">Próximos do prazo</span>
          <span className="crm-info-row-value">{snapshot.dueSoon}</span>
        </div>
      </div>
    </div>
  );
}
