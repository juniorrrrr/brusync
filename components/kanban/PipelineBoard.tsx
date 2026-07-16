import Link from "next/link";
import type { PipelineColumn } from "@/types/crm";

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR");
}

export function PipelineBoard({ columns }: { columns: PipelineColumn[] }) {
  return (
    <div className="crm-kanban">
      {columns.map((column) => (
        <div key={column.status} className="crm-kanban-col">
          <div className="crm-kanban-col-head">
            <span className="crm-kanban-col-title">{column.title}</span>
            <span className="crm-kanban-count">{column.leads.length}</span>
          </div>
          {column.leads.map((lead) => (
            <Link key={lead.id} href={`/lead/${lead.id}`} className="crm-kanban-card">
              <div className="crm-kanban-card-title">{lead.name}</div>
              <div className="crm-kanban-card-meta">
                {lead.company} · {formatDate(lead.createdAt)}
              </div>
            </Link>
          ))}
        </div>
      ))}
    </div>
  );
}
