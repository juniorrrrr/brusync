"use client";

import { useLeadDrawer } from "@/contexts/crm/LeadDrawerContext";
import { formatDate, initials } from "@/domain/crm/format";
import type { CrmLeadWithRelations } from "@/types/crm";

export function AwaitingContactPanel({ leads }: { leads: CrmLeadWithRelations[] }) {
  const { openLead } = useLeadDrawer();

  return (
    <div className="crm-card crm-card-pad reveal in">
      <div className="crm-card-head">
        <div>
          <div className="crm-card-title">Leads aguardando contato</div>
          <div className="crm-card-sub">Sem interação registrada ainda</div>
        </div>
      </div>
      {leads.length === 0 ? (
        <p className="crm-card-sub" style={{ marginTop: 12 }}>
          Nenhum lead aguardando contato — tudo em dia.
        </p>
      ) : (
        <div className="crm-mini-list">
          {leads.map((lead) => (
            <button
              key={lead.id}
              type="button"
              className="crm-mini-row"
              style={{ width: "100%", textAlign: "left" }}
              onClick={() => openLead(lead.id)}
            >
              <span className="crm-avatar" style={{ width: 30, height: 30, fontSize: 11 }}>
                {initials(lead.name)}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="crm-mini-title">{lead.name}</div>
                <div className="crm-mini-meta">{lead.company || "Sem empresa"}</div>
              </div>
              <span className="crm-mini-trail">{formatDate(lead.createdAt)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
