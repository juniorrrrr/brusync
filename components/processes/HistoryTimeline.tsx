import Link from "next/link";
import type { ProcessHistoryEntry } from "@/types/processes";

function formatRelative(iso: string): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours}h`;
  return `há ${Math.floor(hours / 24)}d`;
}

/** Somente leitura — reaproveita o mesmo molde de crm-mini-list/crm-mini-row
 * usado no Feed em tempo real da Central de Operações. Quando showProcessName
 * é true (uso no Dashboard, cruzando vários processos), cada linha vira um
 * link para o processo; no detalhe de um único processo, texto simples. */
export function HistoryTimeline({
  entries,
  showProcessName = false,
}: {
  entries: ProcessHistoryEntry[];
  showProcessName?: boolean;
}) {
  if (entries.length === 0) {
    return <p className="crm-card-sub">Nenhum evento registrado ainda.</p>;
  }

  return (
    <div className="crm-mini-list">
      {entries.map((entry) => {
        const content = (
          <>
            <span className="crm-mini-ico">•</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="crm-mini-title">
                {showProcessName && entry.processName ? `${entry.processName} — ` : ""}
                {entry.description}
              </div>
              {entry.actorName && <div className="crm-card-sub">{entry.actorName}</div>}
            </div>
            <span className="crm-mini-trail">{formatRelative(entry.createdAt)}</span>
          </>
        );

        return showProcessName ? (
          <Link key={entry.id} href={`/processos/${entry.processId}`} className="crm-mini-row">
            {content}
          </Link>
        ) : (
          <div key={entry.id} className="crm-mini-row">
            {content}
          </div>
        );
      })}
    </div>
  );
}
