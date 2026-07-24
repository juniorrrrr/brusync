export function KnowledgeCategoryUsagePanel({
  usage,
}: {
  usage: { categoryName: string; documentCount: number; viewCount: number }[];
}) {
  const maxCount = Math.max(1, ...usage.map((u) => u.documentCount));

  return (
    <div className="crm-card crm-card-pad reveal in">
      <div className="crm-card-head">
        <div>
          <div className="crm-card-title">Categorias com maior utilização</div>
          <div className="crm-card-sub">Documentos e visualizações por categoria</div>
        </div>
      </div>
      {usage.length === 0 ? (
        <p className="crm-card-sub" style={{ marginTop: 12 }}>
          Nenhuma categoria com documentos ainda.
        </p>
      ) : (
        <div className="crm-funnel-row" style={{ flexDirection: "column", gap: 10, marginTop: 8 }}>
          {usage.map((item) => (
            <div
              key={item.categoryName}
              className="crm-funnel-track"
              style={{ position: "relative" }}
            >
              <div
                className="crm-funnel-label"
                style={{ display: "flex", justifyContent: "space-between" }}
              >
                <span>{item.categoryName}</span>
                <span className="crm-card-sub" style={{ margin: 0 }}>
                  {item.documentCount} docs · {item.viewCount} views
                </span>
              </div>
              <div
                style={{
                  height: 8,
                  borderRadius: 6,
                  background: "var(--surface)",
                  overflow: "hidden",
                  marginTop: 4,
                }}
              >
                <div
                  className="crm-funnel-fill"
                  style={{
                    width: `${Math.max(4, (item.documentCount / maxCount) * 100)}%`,
                    height: "100%",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
