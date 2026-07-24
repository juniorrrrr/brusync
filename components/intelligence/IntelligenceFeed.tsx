"use client";

import { useIntelligenceDrillDown } from "@/contexts/intelligence/IntelligenceDrillDownContext";
import type {
  IntelligenceAlert,
  IntelligenceFeedItem,
  IntelligenceInsight,
} from "@/types/intelligence";

function formatRelative(iso: string): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours}h`;
  return `há ${Math.floor(hours / 24)}d`;
}

export function IntelligenceFeed({
  feed,
  insights,
  alerts,
}: {
  feed: IntelligenceFeedItem[];
  insights: IntelligenceInsight[];
  alerts: IntelligenceAlert[];
}) {
  const { open } = useIntelligenceDrillDown();

  function handleClick(item: IntelligenceFeedItem) {
    if (item.sourceType === "insight") {
      const insight = insights.find((i) => i.id === item.sourceId);
      if (insight) open({ kind: "insight", item: insight });
    } else {
      const alert = alerts.find((a) => a.id === item.sourceId);
      if (alert) open({ kind: "alerta", item: alert });
    }
  }

  return (
    <div className="crm-card crm-card-pad reveal in">
      <div className="crm-card-head">
        <div>
          <div className="crm-card-title">Feed Inteligente</div>
          <div className="crm-card-sub">Tudo baseado nos dados reais da operação</div>
        </div>
      </div>
      {feed.length === 0 ? (
        <p className="crm-card-sub" style={{ marginTop: 12 }}>
          Nada a reportar por enquanto.
        </p>
      ) : (
        <div className="crm-int-feed-list" style={{ marginTop: 8 }}>
          {feed.map((item) => (
            <button
              key={item.id}
              type="button"
              className="crm-int-feed-item"
              onClick={() => handleClick(item)}
            >
              <span className={`crm-int-feed-dot ${item.severity}`} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5 }}>{item.sentence}</div>
                <div className="crm-card-sub" style={{ margin: 0, fontSize: 11 }}>
                  {formatRelative(item.createdAt)}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
