import Link from "next/link";
import {
  INTELLIGENCE_SEVERITY_LABEL,
  intelligenceSeverityBadge,
} from "@/domain/intelligence/types";
import type { IntelligenceInsight } from "@/types/intelligence";

export function OperationsInsightsWidget({ insights }: { insights: IntelligenceInsight[] }) {
  return (
    <div className="crm-card crm-card-pad reveal in">
      <div className="crm-card-head">
        <div>
          <div className="crm-card-title">Insights novos</div>
          <div className="crm-card-sub">Gerados nas últimas 24h pela Central de Inteligência</div>
        </div>
        <Link href="/inteligencia" className="btn btn-outline">
          Ver tudo
        </Link>
      </div>
      {insights.length === 0 ? (
        <p className="crm-card-sub" style={{ marginTop: 12 }}>
          Nenhum insight novo nas últimas 24h.
        </p>
      ) : (
        <div className="crm-mini-list">
          {insights.slice(0, 8).map((insight) => (
            <Link key={insight.id} href="/inteligencia" className="crm-mini-row">
              <span className="crm-mini-ico">•</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="crm-mini-title">{insight.title}</div>
                <div className="crm-mini-meta">{insight.description}</div>
              </div>
              <span
                className={`crm-badge ${intelligenceSeverityBadge(insight.severity)}`}
                style={{ fontSize: 10 }}
              >
                {INTELLIGENCE_SEVERITY_LABEL[insight.severity]}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
