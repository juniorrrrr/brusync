"use client";

import { useLeadDrawer } from "@/contexts/crm/LeadDrawerContext";
import { ACTIVITY_TYPE_LABEL } from "@/domain/crm/activityRules";
import { formatRelativeToNow } from "@/domain/crm/format";
import type { RecentActivity } from "@/repositories/crm/activitiesRepository";

export function RecentActivityPanel({ activities }: { activities: RecentActivity[] }) {
  const { openLead } = useLeadDrawer();

  return (
    <div className="crm-card crm-card-pad reveal in">
      <div className="crm-card-head">
        <div>
          <div className="crm-card-title">Atividades recentes</div>
          <div className="crm-card-sub">Últimos registros no CRM</div>
        </div>
      </div>
      {activities.length === 0 ? (
        <p className="crm-card-sub" style={{ marginTop: 12 }}>
          Nenhuma atividade registrada ainda.
        </p>
      ) : (
        <div className="crm-mini-list">
          {activities.map((activity) => (
            <button
              key={activity.id}
              type="button"
              className="crm-mini-row"
              style={{ width: "100%", textAlign: "left" }}
              onClick={() => openLead(activity.crmLeadId)}
            >
              <span className="crm-mini-ico">•</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="crm-mini-title">{activity.title}</div>
                <div className="crm-mini-meta">
                  {activity.leadName} · {ACTIVITY_TYPE_LABEL[activity.type]}
                </div>
              </div>
              <span className="crm-mini-trail">{formatRelativeToNow(activity.createdAt)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
