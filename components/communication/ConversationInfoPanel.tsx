"use client";

import { MESSAGE_EVENT_LABEL } from "@/domain/communication/types";
import { formatDateTime } from "@/domain/crm/format";
import type { ConversationDetail, ConversationSubjectInfo } from "@/types/communication";

function Row({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="crm-info-row">
      <span className="crm-info-row-label">{label}</span>
      <span className="crm-info-row-value">{value}</span>
    </div>
  );
}

export function ConversationInfoPanel({
  conversation,
  subjectInfo,
}: {
  conversation: ConversationDetail | null;
  subjectInfo: ConversationSubjectInfo | null;
}) {
  if (!conversation) {
    return <div className="crm-comm-pane crm-comm-info-pane" />;
  }

  return (
    <div className="crm-comm-pane crm-comm-info-pane">
      <div className="crm-comm-pane-head">
        <span className="crm-drawer-section-title" style={{ marginBottom: 0 }}>
          Informações
        </span>
      </div>

      <div className="crm-comm-info-scroll">
        <div className="crm-drawer-section-title" style={{ marginTop: 0 }}>
          {conversation.crmLeadId ? "Lead" : "Cliente"}
        </div>
        <div className="crm-info-list">
          <Row label="Nome" value={conversation.crmLeadName ?? conversation.clientCompany} />
          <Row label="Canal" value={conversation.channelName} />
          {conversation.crmLeadId && (
            <>
              <Row label="Etapa" value={subjectInfo?.stageLabel ?? null} />
              <Row label="Cidade" value={subjectInfo?.crmLeadCity ?? null} />
              <Row label="Origem" value={subjectInfo?.crmLeadOrigin ?? null} />
            </>
          )}
        </div>

        {conversation.crmLeadId && (subjectInfo?.utmSource || subjectInfo?.utmCampaign) && (
          <>
            <div className="crm-drawer-section-title">Campanha / UTMs</div>
            <div className="crm-info-list">
              <Row label="Campanha" value={subjectInfo?.utmCampaign ?? null} />
              <Row label="Source" value={subjectInfo?.utmSource ?? null} />
              <Row label="Medium" value={subjectInfo?.utmMedium ?? null} />
            </div>
          </>
        )}

        {subjectInfo && subjectInfo.projects.length > 0 && (
          <>
            <div className="crm-drawer-section-title">Projetos</div>
            <div className="crm-mini-list">
              {subjectInfo.projects.map((project) => (
                <div key={project.id} className="crm-mini-row">
                  <span className="crm-mini-ico">📁</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="crm-mini-title">{project.name}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="crm-drawer-section-title">Histórico da conversa</div>
        {conversation.events.length === 0 ? (
          <p className="crm-card-sub">Nenhum evento registrado ainda.</p>
        ) : (
          <div>
            {conversation.events.map((event) => (
              <div key={event.id} className="crm-tl-item">
                <div>
                  <div className="crm-tl-title">{MESSAGE_EVENT_LABEL[event.type]}</div>
                  <div className="crm-tl-meta">
                    {event.actorName ?? "Sistema"} · {formatDateTime(event.createdAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
