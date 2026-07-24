import { CategoryBadge } from "@/components/intelligence/CategoryBadge";
import {
  INTELLIGENCE_SEVERITY_LABEL,
  intelligenceSeverityBadge,
} from "@/domain/intelligence/types";
import type { IntelligenceRecommendation } from "@/types/intelligence";

export function IntelligenceRecommendationsPanel({
  recommendations,
}: {
  recommendations: IntelligenceRecommendation[];
}) {
  return (
    <div className="crm-card crm-card-pad reveal in">
      <div className="crm-card-head">
        <div>
          <div className="crm-card-title">Recomendações</div>
          <div className="crm-card-sub">Próximas ações sugeridas, com o motivo de cada uma</div>
        </div>
      </div>
      {recommendations.length === 0 ? (
        <p className="crm-card-sub" style={{ marginTop: 12 }}>
          Nenhuma recomendação no momento.
        </p>
      ) : (
        <div className="crm-mini-list">
          {recommendations.slice(0, 12).map((rec) => (
            <div key={rec.id} className="crm-mini-row" style={{ alignItems: "flex-start" }}>
              <span className="crm-mini-ico">•</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="crm-mini-title">
                  {rec.title}
                  {rec.relatedEntityLabel && (
                    <span style={{ fontWeight: 400 }}> — {rec.relatedEntityLabel}</span>
                  )}
                </div>
                <div className="crm-mini-meta">{rec.reason}</div>
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}
              >
                <span
                  className={`crm-badge ${intelligenceSeverityBadge(rec.severity)}`}
                  style={{ fontSize: 10 }}
                >
                  {INTELLIGENCE_SEVERITY_LABEL[rec.severity]}
                </span>
                <CategoryBadge category={rec.category} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
