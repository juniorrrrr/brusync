"use client";

import { useState } from "react";
import { CategoryBadge } from "@/components/intelligence/CategoryBadge";
import { IconEye } from "@/components/ui/icons";
import type { RevenueInsight } from "@/types/revenueIntelligence";

const POLARITY_BADGE: Record<RevenueInsight["polarity"], string> = {
  positivo: "ok",
  negativo: "danger",
  neutro: "info",
};

const POLARITY_LABEL: Record<RevenueInsight["polarity"], string> = {
  positivo: "Positivo",
  negativo: "Atenção",
  neutro: "Neutro",
};

/** Card só leitura — os insights aqui são calculados em memória a cada load
 * (nunca gravados em intelligence_insights), sem id de banco nem ciclo de
 * reconhecer/ignorar, então não reaproveita IntelligenceInsightCard (que é
 * acoplado à ação ignoreIntelligenceInsightAction da Fase 19). */
export function RevenueInsightCard({ insight }: { insight: RevenueInsight }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="crm-int-card-row">
      <div className="crm-int-card-top">
        <div>
          <div className="crm-int-card-title">{insight.title}</div>
          <div className="crm-int-card-desc">{insight.description}</div>
        </div>
        <span className={`crm-badge ${POLARITY_BADGE[insight.polarity]}`}>
          {POLARITY_LABEL[insight.polarity]}
        </span>
      </div>

      <div className="crm-int-card-actions" style={{ justifyContent: "space-between" }}>
        <CategoryBadge category={insight.category} />
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => setExpanded((value) => !value)}
        >
          <IconEye size={13} /> {expanded ? "Ocultar evidências" : "Ver evidências"}
        </button>
      </div>

      {expanded && (
        <div className="crm-int-evidence-list">
          {insight.evidence.map((item) => (
            <div key={item.label} className="crm-int-evidence-row">
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
