"use client";

import { useState } from "react";
import { IconEye } from "@/components/ui/icons";
import type { PerformanceAlert } from "@/types/performance";

const SEVERITY_BADGE: Record<PerformanceAlert["severity"], string> = {
  info: "info",
  atencao: "warn",
  critico: "danger",
};

const SEVERITY_LABEL: Record<PerformanceAlert["severity"], string> = {
  info: "Informativo",
  atencao: "Atenção",
  critico: "Crítico",
};

/** Somente leitura — calculado em memória a cada load (ver
 * domain/performance/alerts.ts), sem persistência nem ação de reconhecer. */
export function PerformanceAlertCard({ alert }: { alert: PerformanceAlert }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="crm-int-card-row">
      <div className="crm-int-card-top">
        <div>
          <div className="crm-int-card-title">{alert.title}</div>
          <div className="crm-int-card-desc">{alert.description}</div>
        </div>
        <span className={`crm-badge ${SEVERITY_BADGE[alert.severity]}`}>
          {SEVERITY_LABEL[alert.severity]}
        </span>
      </div>
      <div className="crm-int-card-actions">
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
          {alert.evidence.map((item) => (
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
