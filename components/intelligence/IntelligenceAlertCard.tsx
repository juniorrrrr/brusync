"use client";

import { CategoryBadge } from "@/components/intelligence/CategoryBadge";
import { IconCheck, IconEye } from "@/components/ui/icons";
import { useIntelligenceDrillDown } from "@/contexts/intelligence/IntelligenceDrillDownContext";
import {
  INTELLIGENCE_SEVERITY_LABEL,
  intelligenceSeverityBadge,
} from "@/domain/intelligence/types";
import { useIntelligenceAlertActions } from "@/hooks/intelligence/useIntelligenceAlertActions";
import type { IntelligenceAlert } from "@/types/intelligence";

export function IntelligenceAlertCard({ alert }: { alert: IntelligenceAlert }) {
  const { open } = useIntelligenceDrillDown();
  const { acknowledge, resolve, isPending } = useIntelligenceAlertActions();
  const isDemo = alert.id.startsWith("demo-");

  return (
    <div className="crm-int-card-row">
      <div className="crm-int-card-top">
        <div>
          <div className="crm-int-card-title">{alert.title}</div>
          <div className="crm-int-card-desc">{alert.description}</div>
        </div>
        <span className={`crm-badge ${intelligenceSeverityBadge(alert.severity)}`}>
          {INTELLIGENCE_SEVERITY_LABEL[alert.severity]}
        </span>
      </div>

      <div className="crm-int-card-actions" style={{ justifyContent: "space-between" }}>
        <CategoryBadge category={alert.category} />
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => open({ kind: "alerta", item: alert })}
          >
            <IconEye size={13} /> Ver dados
          </button>
          {!isDemo && alert.status === "ativo" && (
            <button
              type="button"
              className="btn btn-outline"
              disabled={isPending}
              onClick={() => acknowledge(alert.id)}
            >
              Reconhecer
            </button>
          )}
          {!isDemo && (
            <button
              type="button"
              className="btn btn-outline"
              disabled={isPending}
              onClick={() => resolve(alert.id)}
            >
              <IconCheck size={13} /> Resolver
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
