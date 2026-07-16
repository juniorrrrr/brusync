import type { ReactNode } from "react";

export interface InboxRow {
  name: string;
  preview: string;
  time: string;
  channelIcon: ReactNode;
  channelColor: string;
  active?: boolean;
}

export function InboxList({ rows }: { rows: InboxRow[] }) {
  return (
    <div className="inbox-list">
      {rows.map((row) => (
        <div className={row.active ? "inbox-item active" : "inbox-item"} key={row.name}>
          <span className="inbox-channel" style={{ background: row.channelColor }}>
            {row.channelIcon}
          </span>
          <div>
            <div className="inbox-name">{row.name}</div>
            <div className="inbox-preview">{row.preview}</div>
          </div>
          <div className="inbox-meta">
            <span className="inbox-time">{row.time}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
