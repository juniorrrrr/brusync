import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AlertCandidate } from "@/domain/intelligence/rules";
import type {
  IntelligenceAlert,
  IntelligenceAlertStatus,
  IntelligenceCategory,
  IntelligenceEvidenceItem,
  IntelligenceSeverity,
} from "@/types/intelligence";

interface AlertRow {
  id: string;
  rule_key: string | null;
  type: string;
  category: IntelligenceCategory;
  severity: IntelligenceSeverity;
  title: string;
  description: string;
  related_entity_type: string | null;
  related_entity_id: string | null;
  evidence: IntelligenceEvidenceItem[];
  status: IntelligenceAlertStatus;
  acknowledged_at: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  acknowledger?: { name: string | null; email: string | null } | null;
}

const ALERT_SELECT = `
  id, rule_key, type, category, severity, title, description,
  related_entity_type, related_entity_id, evidence, status, acknowledged_at, resolved_at, created_at, updated_at,
  acknowledger:profiles!intelligence_alerts_acknowledged_by_fkey (name, email)
`;

function mapAlert(row: AlertRow): IntelligenceAlert {
  return {
    id: row.id,
    ruleKey: row.rule_key,
    type: row.type,
    category: row.category,
    severity: row.severity,
    title: row.title,
    description: row.description,
    relatedEntityType: row.related_entity_type,
    relatedEntityId: row.related_entity_id,
    evidence: row.evidence ?? [],
    status: row.status,
    acknowledgedByName: row.acknowledger?.name ?? row.acknowledger?.email ?? null,
    acknowledgedAt: row.acknowledged_at,
    resolvedAt: row.resolved_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listActiveAlerts(supabase: SupabaseClient): Promise<IntelligenceAlert[]> {
  const { data, error } = await supabase
    .from("intelligence_alerts")
    .select(ALERT_SELECT)
    .in("status", ["ativo", "reconhecido"])
    .order("severity", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Falha ao carregar alertas: ${error.message}`);
  return ((data ?? []) as unknown as AlertRow[]).map(mapAlert);
}

export async function getAlertById(
  supabase: SupabaseClient,
  id: string,
): Promise<IntelligenceAlert | null> {
  const { data, error } = await supabase
    .from("intelligence_alerts")
    .select(ALERT_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Falha ao carregar alerta: ${error.message}`);
  return data ? mapAlert(data as unknown as AlertRow) : null;
}

export async function findActiveByRuleAndEntity(
  supabase: SupabaseClient,
  ruleKey: string,
  relatedEntityId: string | null,
): Promise<{ id: string } | null> {
  let query = supabase
    .from("intelligence_alerts")
    .select("id")
    .eq("rule_key", ruleKey)
    .in("status", ["ativo", "reconhecido"]);
  query = relatedEntityId
    ? query.eq("related_entity_id", relatedEntityId)
    : query.is("related_entity_id", null);

  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(`Falha ao verificar alerta existente: ${error.message}`);
  return data as { id: string } | null;
}

export async function upsertAlert(
  supabase: SupabaseClient,
  existingId: string | null,
  candidate: AlertCandidate,
): Promise<void> {
  const payload = {
    rule_key: candidate.ruleKey,
    type: candidate.type,
    category: candidate.category,
    severity: candidate.severity,
    title: candidate.title,
    description: candidate.description,
    related_entity_type: candidate.relatedEntityType,
    related_entity_id: candidate.relatedEntityId,
    evidence: candidate.evidence,
  };

  if (existingId) {
    const { error } = await supabase
      .from("intelligence_alerts")
      .update(payload)
      .eq("id", existingId);
    if (error) throw new Error(`Falha ao atualizar alerta: ${error.message}`);
    return;
  }

  const { error } = await supabase
    .from("intelligence_alerts")
    .insert({ ...payload, status: "ativo" });
  if (error) throw new Error(`Falha ao criar alerta: ${error.message}`);
}

export async function resolveAlertsNotIn(
  supabase: SupabaseClient,
  keepIds: string[],
): Promise<void> {
  let query = supabase
    .from("intelligence_alerts")
    .update({ status: "resolvido", resolved_at: new Date().toISOString() })
    .in("status", ["ativo", "reconhecido"]);
  if (keepIds.length > 0) query = query.not("id", "in", `(${keepIds.join(",")})`);

  const { error } = await query;
  if (error) throw new Error(`Falha ao resolver alertas: ${error.message}`);
}

export async function acknowledgeAlert(
  supabase: SupabaseClient,
  id: string,
  profileId: string,
): Promise<void> {
  const { error } = await supabase
    .from("intelligence_alerts")
    .update({
      status: "reconhecido",
      acknowledged_by: profileId,
      acknowledged_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(`Falha ao reconhecer alerta: ${error.message}`);
}

export async function resolveAlert(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase
    .from("intelligence_alerts")
    .update({ status: "resolvido", resolved_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(`Falha ao resolver alerta: ${error.message}`);
}
