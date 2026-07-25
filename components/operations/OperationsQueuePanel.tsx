import Link from "next/link";
import type { OperationsQueueItem } from "@/types/operations";

function formatDue(dueAt: string | null): string {
  if (!dueAt) return "Sem prazo";
  return new Date(dueAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function OperationsQueuePanel({ queue }: { queue: OperationsQueueItem[] }) {
  return (
    <div className="crm-card crm-card-pad reveal in">
      <div className="crm-card-head">
        <div>
          <div className="crm-card-title">Minha fila</div>
          <div className="crm-card-sub">
            O que depende de você agora — {queue.length} item{queue.length === 1 ? "" : "s"}
          </div>
        </div>
      </div>
      {queue.length === 0 ? (
        <p className="crm-card-sub" style={{ marginTop: 12 }}>
          Nada pendente atribuído a você. 🎉
        </p>
      ) : (
        <div className="crm-mini-list">
          {queue.slice(0, 15).map((item) => (
            <Link key={item.id} href={item.href} className="crm-mini-row">
              <span className="crm-mini-ico">•</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="crm-mini-title">{item.title}</div>
                {item.subtitle && <div className="crm-mini-meta">{item.subtitle}</div>}
              </div>
              <span
                className={`crm-badge ${item.overdue ? "danger" : "neutral"}`}
                style={{ fontSize: 10 }}
              >
                {formatDue(item.dueAt)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
