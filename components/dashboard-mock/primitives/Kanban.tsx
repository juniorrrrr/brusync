export interface KanbanCard {
  title: string;
  value: string;
}

export interface KanbanColumn {
  title: string;
  cards: KanbanCard[];
}

export function Kanban({ columns }: { columns: KanbanColumn[] }) {
  return (
    <div className="kanban">
      {columns.map((col) => (
        <div className="kanban-col" key={col.title}>
          <div className="kanban-col-head">
            {col.title}
            <span>{col.cards.length}</span>
          </div>
          {col.cards.map((card) => (
            <div className="kanban-card" key={card.title}>
              <div className="kc-title">{card.title}</div>
              <div className="kc-meta">
                <span className="kc-value">{card.value}</span>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
