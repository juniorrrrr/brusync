import Link from "next/link";
import type { OperationsModuleHealth } from "@/types/operations";

function formatUpdatedAt(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

const STATUS_BADGE: Record<OperationsModuleHealth["status"], string> = {
  ok: "ok",
  atencao: "warn",
  critico: "danger",
};
const STATUS_LABEL: Record<OperationsModuleHealth["status"], string> = {
  ok: "OK",
  atencao: "Atenção",
  critico: "Crítico",
};

export function OperationsModuleHealthGrid({ modules }: { modules: OperationsModuleHealth[] }) {
  return (
    <div className="crm-card crm-card-pad reveal in">
      <div className="crm-card-head">
        <div>
          <div className="crm-card-title">Saúde da operação</div>
          <div className="crm-card-sub">Status, última atualização e pendências por módulo</div>
        </div>
      </div>
      <div className="crm-ops-health-grid" style={{ marginTop: 10 }}>
        {modules.map((module) => (
          <Link key={module.key} href={module.href} className="crm-ops-health-card">
            <div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{module.label}</div>
              <div className="crm-card-sub" style={{ margin: 0 }}>
                Atualizado às {formatUpdatedAt(module.lastUpdatedAt ?? new Date().toISOString())} ·{" "}
                {module.pendingCount} pendência{module.pendingCount === 1 ? "" : "s"}
              </div>
            </div>
            <span className={`crm-badge ${STATUS_BADGE[module.status]}`}>
              {STATUS_LABEL[module.status]}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
