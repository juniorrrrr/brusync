import Link from "next/link";
import type { OperationsFeedItem } from "@/types/operations";

function formatRelative(iso: string): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours}h`;
  return `há ${Math.floor(hours / 24)}d`;
}

export function OperationsFeed({ feed }: { feed: OperationsFeedItem[] }) {
  return (
    <div className="crm-card crm-card-pad reveal in">
      <div className="crm-card-head">
        <div>
          <div className="crm-card-title">Feed em tempo real</div>
          <div className="crm-card-sub">Tudo que aconteceu na operação, em ordem cronológica</div>
        </div>
      </div>
      {feed.length === 0 ? (
        <p className="crm-card-sub" style={{ marginTop: 12 }}>
          Nada por aqui ainda.
        </p>
      ) : (
        <div className="crm-mini-list">
          {feed.map((item) => (
            <Link key={item.id} href={item.href ?? "#"} className="crm-mini-row">
              <span className="crm-mini-ico">•</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="crm-mini-title">{item.sentence}</div>
              </div>
              <span className="crm-mini-trail">{formatRelative(item.occurredAt)}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
