import Link from "next/link";
import type { OperationsFeedItem } from "@/types/operations";

function dayLabel(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today.getTime() - 86_400_000);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDay(date, today)) return "Hoje";
  if (sameDay(date, yesterday)) return "Ontem";
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function groupByDay(items: OperationsFeedItem[]): { label: string; items: OperationsFeedItem[] }[] {
  const groups: { label: string; items: OperationsFeedItem[] }[] = [];
  for (const item of items) {
    const label = dayLabel(item.occurredAt);
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup.label === label) lastGroup.items.push(item);
    else groups.push({ label, items: [item] });
  }
  return groups;
}

export function OperationsTimeline({ timeline }: { timeline: OperationsFeedItem[] }) {
  const groups = groupByDay(timeline);

  return (
    <div className="crm-card crm-card-pad reveal in">
      <div className="crm-card-head">
        <div>
          <div className="crm-card-title">Timeline global</div>
          <div className="crm-card-sub">
            CRM, Projetos, Financeiro, Comunicação, Automações, Marketing e Conversões — tudo junto
          </div>
        </div>
      </div>
      {groups.length === 0 ? (
        <p className="crm-card-sub" style={{ marginTop: 12 }}>
          Nenhum evento registrado ainda.
        </p>
      ) : (
        <div className="crm-timeline" style={{ marginTop: 10 }}>
          {groups.map((group) => (
            <div key={group.label} style={{ marginBottom: 14 }}>
              <div className="crm-drawer-section-title">{group.label}</div>
              {group.items.map((item) => (
                <Link
                  key={item.id}
                  href={item.href ?? "#"}
                  className="crm-timeline-item"
                  style={{ display: "flex", gap: 10 }}
                >
                  <span className="crm-timeline-dot" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="crm-timeline-title">{item.sentence}</div>
                    <div className="crm-timeline-meta">{formatTime(item.occurredAt)}</div>
                  </div>
                </Link>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
