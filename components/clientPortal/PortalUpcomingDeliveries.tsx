import Link from "next/link";
import { formatDateTime } from "@/domain/crm/format";
import type { PortalUpcomingDelivery } from "@/types/clientPortal";

const KIND_LABEL: Record<PortalUpcomingDelivery["kind"], string> = {
  projeto: "Projeto",
  etapa: "Etapa",
  tarefa: "Tarefa",
};

export function PortalUpcomingDeliveries({ items }: { items: PortalUpcomingDelivery[] }) {
  if (items.length === 0) {
    return <p className="crm-card-sub">Nenhuma entrega prevista no momento.</p>;
  }

  return (
    <div>
      {items.map((item) => (
        <Link
          key={item.id}
          href={`/portal/projetos/${item.projectId}`}
          className="crm-pj-task-row"
          style={{ display: "flex" }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}
            >
              <strong>{item.title}</strong>
              <span className="crm-card-sub" style={{ margin: 0 }}>
                {formatDateTime(item.dueAt)}
              </span>
            </div>
            <div className="crm-card-sub">
              {KIND_LABEL[item.kind]} · {item.projectName}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
