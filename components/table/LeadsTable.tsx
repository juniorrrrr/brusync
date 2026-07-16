import Link from "next/link";
import { LEAD_STATUS_BADGE, LEAD_STATUS_LABEL } from "@/lib/crm/mockData";
import type { Lead } from "@/types/crm";

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR");
}

export function LeadsTable({ leads }: { leads: Lead[] }) {
  return (
    <div className="crm-table-wrap">
      <table className="crm-table">
        <thead>
          <tr>
            <th>Lead</th>
            <th>Empresa</th>
            <th>Origem</th>
            <th>Status</th>
            <th>Responsável</th>
            <th>Criado em</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead.id}>
              <td>
                <Link href={`/lead/${lead.id}`} className="cell-strong">
                  {lead.name}
                </Link>
              </td>
              <td className="cell-muted">{lead.company}</td>
              <td className="cell-muted">{lead.origin}</td>
              <td>
                <span className={`crm-badge ${LEAD_STATUS_BADGE[lead.status]}`}>
                  {LEAD_STATUS_LABEL[lead.status]}
                </span>
              </td>
              <td className="cell-muted">{lead.owner}</td>
              <td className="cell-muted">{formatDate(lead.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
