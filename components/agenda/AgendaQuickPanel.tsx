import { formatDateTime } from "@/domain/crm/format";
import type { AgendaEvent } from "@/types/agenda";

export function AgendaQuickPanel({
  title,
  events,
  emptyText,
}: {
  title: string;
  events: AgendaEvent[];
  emptyText: string;
}) {
  return (
    <div className="crm-card crm-card-pad">
      <div className="crm-card-title">{title}</div>
      {events.length === 0 ? (
        <p className="crm-card-sub" style={{ marginTop: 8 }}>
          {emptyText}
        </p>
      ) : (
        events.slice(0, 4).map((event) => (
          <div key={event.id} className="crm-ag-row" style={{ padding: "8px 0" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{event.title}</div>
              <div className="crm-card-sub">
                {formatDateTime(event.scheduledAt)}
                {event.leadName ? ` · ${event.leadName}` : ""}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
