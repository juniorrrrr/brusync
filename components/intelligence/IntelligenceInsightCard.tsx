"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { ignoreIntelligenceInsightAction } from "@/application/intelligence/intelligenceInsightsActions";
import { CategoryBadge } from "@/components/intelligence/CategoryBadge";
import { IconEye, IconX } from "@/components/ui/icons";
import { useIntelligenceDrillDown } from "@/contexts/intelligence/IntelligenceDrillDownContext";
import {
  INTELLIGENCE_SEVERITY_LABEL,
  intelligenceSeverityBadge,
} from "@/domain/intelligence/types";
import type { IntelligenceInsight } from "@/types/intelligence";

export function IntelligenceInsightCard({ insight }: { insight: IntelligenceInsight }) {
  const { open } = useIntelligenceDrillDown();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isDemo = insight.id.startsWith("demo-");

  function handleIgnore() {
    startTransition(async () => {
      await ignoreIntelligenceInsightAction(insight.id);
      router.refresh();
    });
  }

  return (
    <div className="crm-int-card-row">
      <div className="crm-int-card-top">
        <div>
          <div className="crm-int-card-title">{insight.title}</div>
          <div className="crm-int-card-desc">{insight.description}</div>
        </div>
        <span className={`crm-badge ${intelligenceSeverityBadge(insight.severity)}`}>
          {INTELLIGENCE_SEVERITY_LABEL[insight.severity]}
        </span>
      </div>

      <div className="crm-int-card-actions" style={{ justifyContent: "space-between" }}>
        <CategoryBadge category={insight.category} />
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => open({ kind: "insight", item: insight })}
          >
            <IconEye size={13} /> Ver dados
          </button>
          {!isDemo && (
            <button
              type="button"
              className="btn btn-outline"
              disabled={isPending}
              onClick={handleIgnore}
            >
              <IconX size={13} /> Ignorar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
