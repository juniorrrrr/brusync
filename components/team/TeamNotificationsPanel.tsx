"use client";

import { useMarkNotificationRead } from "@/hooks/team/useMarkNotificationRead";
import type { TeamNotification } from "@/types/team";

function NotificationRow({ notification }: { notification: TeamNotification }) {
  const { readAt, markRead, isPending } = useMarkNotificationRead(
    notification.id,
    notification.readAt,
  );

  return (
    <button
      type="button"
      onClick={markRead}
      disabled={isPending || Boolean(readAt)}
      className="crm-team-breakdown-row"
      style={{
        width: "100%",
        textAlign: "left",
        border: "none",
        background: "none",
        cursor: readAt ? "default" : "pointer",
      }}
    >
      <span style={{ fontWeight: readAt ? 400 : 700 }}>{notification.title}</span>
      <span className="crm-card-sub">
        {new Date(notification.createdAt).toLocaleDateString("pt-BR")}
      </span>
    </button>
  );
}

export function TeamNotificationsPanel({ notifications }: { notifications: TeamNotification[] }) {
  return (
    <div className="crm-card">
      <div className="crm-card-head">
        <div className="crm-card-title">Notificações</div>
      </div>
      <div className="crm-card-pad">
        <div className="crm-mini-list">
          {notifications.slice(0, 8).map((n) => (
            <NotificationRow key={n.id} notification={n} />
          ))}
          {notifications.length === 0 && <p className="crm-card-sub">Nenhuma notificação.</p>}
        </div>
      </div>
    </div>
  );
}
