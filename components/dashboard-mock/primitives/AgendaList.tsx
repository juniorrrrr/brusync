export interface AgendaRow {
  time: string;
  title: string;
  sub: string;
}

export function AgendaList({ rows }: { rows: AgendaRow[] }) {
  return (
    <div className="agenda-list">
      {rows.map((row) => (
        <div className="agenda-item" key={row.time}>
          <div className="agenda-time">{row.time}</div>
          <div className="agenda-card">
            <div className="ag-title">{row.title}</div>
            <div className="ag-sub">{row.sub}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
