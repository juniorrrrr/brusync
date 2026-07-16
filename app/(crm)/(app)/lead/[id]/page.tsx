import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { IconArrowLeft } from "@/components/ui/icons";
import { getMockLeadById, LEAD_STATUS_BADGE, LEAD_STATUS_LABEL } from "@/lib/crm/mockData";

export const metadata: Metadata = {
  title: "Lead — Brusync OS",
  robots: { index: false, follow: false },
};

function initials(name: string) {
  const parts = name.split(" ").filter(Boolean);
  return parts.length >= 2
    ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR");
}

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lead = getMockLeadById(id);

  if (!lead) notFound();

  return (
    <div>
      <Link href="/leads" className="crm-back-link">
        <IconArrowLeft size={15} />
        Voltar para Leads
      </Link>

      <div className="crm-lead-head">
        <div className="crm-lead-avatar">{initials(lead.name)}</div>
        <div>
          <div className="crm-lead-name">
            {lead.name}
            <span className={`crm-badge ${LEAD_STATUS_BADGE[lead.status]}`}>
              {LEAD_STATUS_LABEL[lead.status]}
            </span>
          </div>
          <div className="crm-lead-company">{lead.company}</div>
        </div>
      </div>

      <div className="crm-row">
        <div className="crm-card crm-card-pad">
          <div className="crm-card-title">Atividades</div>
          <div className="crm-card-sub">Histórico de interações com o lead</div>
          <div className="crm-timeline">
            <div className="crm-timeline-item">
              <span className="crm-timeline-dot" />
              <div>
                <div className="crm-timeline-title">Lead capturado via {lead.origin}</div>
                <div className="crm-timeline-meta">{formatDate(lead.createdAt)}</div>
              </div>
            </div>
            <div className="crm-timeline-item">
              <span className="crm-timeline-dot" />
              <div>
                <div className="crm-timeline-title">Atribuído a {lead.owner}</div>
                <div className="crm-timeline-meta">{formatDate(lead.createdAt)}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="crm-card crm-card-pad">
          <div className="crm-card-title">Informações</div>
          <div className="crm-info-list">
            <div className="crm-info-row">
              <span className="crm-info-row-label">Empresa</span>
              <span className="crm-info-row-value">{lead.company}</span>
            </div>
            <div className="crm-info-row">
              <span className="crm-info-row-label">Origem</span>
              <span className="crm-info-row-value">{lead.origin}</span>
            </div>
            <div className="crm-info-row">
              <span className="crm-info-row-label">Responsável</span>
              <span className="crm-info-row-value">{lead.owner}</span>
            </div>
            <div className="crm-info-row">
              <span className="crm-info-row-label">Criado em</span>
              <span className="crm-info-row-value">{formatDate(lead.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
