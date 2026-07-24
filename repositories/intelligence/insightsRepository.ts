import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { InsightCandidate } from "@/domain/intelligence/rules";
import type {
  IntelligenceCategory,
  IntelligenceEvidenceItem,
  IntelligenceInsight,
  IntelligenceInsightStatus,
  IntelligenceSeverity,
  IntelligenceTrendDirection,
} from "@/types/intelligence";

interface InsightRow {
  id: string;
  rule_key: string | null;
  type: string;
  category: IntelligenceCategory;
  severity: IntelligenceSeverity;
  title: string;
  description: string;
  metric_value: number | null;
  metric_unit: string | null;
  trend: IntelligenceTrendDirection | null;
  related_entity_type: string | null;
  related_entity_id: string | null;
  evidence: IntelligenceEvidenceItem[];
  period_from: string | null;
  period_to: string | null;
  status: IntelligenceInsightStatus;
  created_at: string;
  updated_at: string;
}

const INSIGHT_SELECT = `
  id, rule_key, type, category, severity, title, description, metric_value, metric_unit, trend,
  related_entity_type, related_entity_id, evidence, period_from, period_to, status, created_at, updated_at
`;

function mapInsight(row: InsightRow): IntelligenceInsight {
  return {
    id: row.id,
    ruleKey: row.rule_key,
    type: row.type,
    category: row.category,
    severity: row.severity,
    title: row.title,
    description: row.description,
    metricValue: row.metric_value,
    metricUnit: row.metric_unit,
    trend: row.trend,
    relatedEntityType: row.related_entity_type,
    relatedEntityId: row.related_entity_id,
    evidence: row.evidence ?? [],
    periodFrom: row.period_from,
    periodTo: row.period_to,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listActiveInsights(supabase: SupabaseClient): Promise<IntelligenceInsight[]> {
  const { data, error } = await supabase
    .from("intelligence_insights")
    .select(INSIGHT_SELECT)
    .eq("status", "ativo")
    .order("severity", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Falha ao carregar insights: ${error.message}`);
  return ((data ?? []) as unknown as InsightRow[]).map(mapInsight);
}

export async function getInsightById(
  supabase: SupabaseClient,
  id: string,
): Promise<IntelligenceInsight | null> {
  const { data, error } = await supabase
    .from("intelligence_insights")
    .select(INSIGHT_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Falha ao carregar insight: ${error.message}`);
  return data ? mapInsight(data as unknown as InsightRow) : null;
}

export async function findActiveByRuleAndEntity(
  supabase: SupabaseClient,
  ruleKey: string,
  relatedEntityId: string | null,
): Promise<{ id: string } | null> {
  let query = supabase
    .from("intelligence_insights")
    .select("id")
    .eq("rule_key", ruleKey)
    .eq("status", "ativo");
  query = relatedEntityId
    ? query.eq("related_entity_id", relatedEntityId)
    : query.is("related_entity_id", null);

  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(`Falha ao verificar insight existente: ${error.message}`);
  return data as { id: string } | null;
}

export async function upsertInsight(
  supabase: SupabaseClient,
  existingId: string | null,
  candidate: InsightCandidate,
  periodFrom: string,
  periodTo: string,
): Promise<void> {
  const payload = {
    rule_key: candidate.ruleKey,
    type: candidate.type,
    category: candidate.category,
    severity: candidate.severity,
    title: candidate.title,
    description: candidate.description,
    metric_value: candidate.metricValue,
    metric_unit: candidate.metricUnit,
    trend: candidate.trend,
    related_entity_type: candidate.relatedEntityType,
    related_entity_id: candidate.relatedEntityId,
    evidence: candidate.evidence,
    period_from: periodFrom,
    period_to: periodTo,
    status: "ativo" as const,
  };

  if (existingId) {
    const { error } = await supabase
      .from("intelligence_insights")
      .update(payload)
      .eq("id", existingId);
    if (error) throw new Error(`Falha ao atualizar insight: ${error.message}`);
    return;
  }

  const { error } = await supabase.from("intelligence_insights").insert(payload);
  if (error) throw new Error(`Falha ao criar insight: ${error.message}`);
}

/** Auto-resolves every currently-active insight whose id is not in
 * `keepIds` — called once per engine run right after upserting this run's
 * candidates, so an insight whose underlying condition cleared (e.g. the
 * stalled leads got contacted) disappears from the active list instead of
 * lingering forever. */
export async function resolveInsightsNotIn(
  supabase: SupabaseClient,
  keepIds: string[],
): Promise<void> {
  let query = supabase
    .from("intelligence_insights")
    .update({ status: "resolvido", resolved_at: new Date().toISOString() })
    .eq("status", "ativo");
  if (keepIds.length > 0) query = query.not("id", "in", `(${keepIds.join(",")})`);

  const { error } = await query;
  if (error) throw new Error(`Falha ao resolver insights: ${error.message}`);
}

export async function ignoreInsight(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase
    .from("intelligence_insights")
    .update({ status: "ignorado" })
    .eq("id", id);
  if (error) throw new Error(`Falha ao ignorar insight: ${error.message}`);
}
