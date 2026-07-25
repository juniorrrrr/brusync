import Link from "next/link";
import type { AgendaEvent } from "@/types/agenda";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function OperationsAgendaWidget({ events }: { events: AgendaEvent[] }) {
  const upcoming = events
    .filter((e) => e.status === "agendado")
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));

  return (
    <div className="crm-card crm-card-pad reveal in">
      <div className="crm-card-head">
        <div>
          <div className="crm-card-title">Agenda de hoje</div>
          <div className="crm-card-sub">
            {upcoming.length} compromisso{upcoming.length === 1 ? "" : "s"}
          </div>
        </div>
        <Link href="/agenda" className="btn btn-outline">
          Ver agenda
        </Link>
      </div>
      {upcoming.length === 0 ? (
        <p className="crm-card-sub" style={{ marginTop: 12 }}>
          Nada agendado para hoje.
        </p>
      ) : (
        <div className="crm-mini-list">
          {upcoming.slice(0, 8).map((event) => (
            <div key={event.id} className="crm-mini-row">
              <span className="crm-mini-ico">{formatTime(event.scheduledAt)}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="crm-mini-title">{event.title}</div>
                {event.leadName && <div className="crm-mini-meta">{event.leadName}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
