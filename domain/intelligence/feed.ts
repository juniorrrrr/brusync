import type {
  IntelligenceAlert,
  IntelligenceFeedItem,
  IntelligenceInsight,
} from "@/types/intelligence";

const SEVERITY_ORDER = { critico: 0, atencao: 1, info: 2 } as const;

/** The Feed is a chronological/severity-ranked read of the SAME
 * description already written by the rule that generated each insight/
 * alert (see domain/intelligence/rules.ts) — there is no separate sentence
 * generator here, on purpose: two independent places writing "the same"
 * sentence is exactly how a feed drifts from the data that justifies it. */
export function buildFeed(
  insights: IntelligenceInsight[],
  alerts: IntelligenceAlert[],
): IntelligenceFeedItem[] {
  const fromInsights: IntelligenceFeedItem[] = insights
    .filter((i) => i.status === "ativo")
    .map((i) => ({
      id: `insight-${i.id}`,
      sentence: i.description,
      category: i.category,
      severity: i.severity,
      createdAt: i.createdAt,
      sourceType: "insight" as const,
      sourceId: i.id,
    }));

  const fromAlerts: IntelligenceFeedItem[] = alerts
    .filter((a) => a.status === "ativo")
    .map((a) => ({
      id: `alerta-${a.id}`,
      sentence: a.description,
      category: a.category,
      severity: a.severity,
      createdAt: a.createdAt,
      sourceType: "alerta" as const,
      sourceId: a.id,
    }));

  return [...fromInsights, ...fromAlerts].sort((a, b) => {
    const severityDiff = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
    if (severityDiff !== 0) return severityDiff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}
