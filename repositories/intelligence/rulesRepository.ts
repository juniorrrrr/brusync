import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  IntelligenceCategory,
  IntelligenceRule,
  IntelligenceRuleKind,
  IntelligenceSeverity,
} from "@/types/intelligence";

interface RuleRow {
  id: string;
  key: string;
  name: string;
  description: string | null;
  category: IntelligenceCategory;
  kind: IntelligenceRuleKind;
  severity_default: IntelligenceSeverity;
  enabled: boolean;
  config: Record<string, number | string | boolean>;
}

function mapRule(row: RuleRow): IntelligenceRule {
  return {
    id: row.id,
    key: row.key,
    name: row.name,
    description: row.description,
    category: row.category,
    kind: row.kind,
    severityDefault: row.severity_default,
    enabled: row.enabled,
    config: row.config ?? {},
  };
}

export async function listRules(supabase: SupabaseClient): Promise<IntelligenceRule[]> {
  const { data, error } = await supabase
    .from("intelligence_rules")
    .select("id, key, name, description, category, kind, severity_default, enabled, config")
    .order("category", { ascending: true });

  if (error) throw new Error(`Falha ao carregar regras: ${error.message}`);
  return ((data ?? []) as unknown as RuleRow[]).map(mapRule);
}

/** Flattens enabled rules into the { ruleKey: { field: value } } shape the
 * domain rule functions expect (see domain/intelligence/thresholds.ts
 * resolveThreshold) — disabled rules are simply left out, so their
 * corresponding domain function never fires. */
export async function getEnabledRuleConfig(
  supabase: SupabaseClient,
): Promise<Record<string, Record<string, number>>> {
  const rules = await listRules(supabase);
  const config: Record<string, Record<string, number>> = {};
  for (const rule of rules) {
    if (!rule.enabled) continue;
    const numericFields: Record<string, number> = {};
    for (const [field, value] of Object.entries(rule.config)) {
      if (typeof value === "number") numericFields[field] = value;
    }
    config[rule.key] = numericFields;
  }
  return config;
}

export async function getEnabledRuleKeys(supabase: SupabaseClient): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("intelligence_rules")
    .select("key")
    .eq("enabled", true);
  if (error) throw new Error(`Falha ao carregar regras habilitadas: ${error.message}`);
  return new Set((data ?? []).map((r) => (r as { key: string }).key));
}

export async function updateRuleEnabled(
  supabase: SupabaseClient,
  key: string,
  enabled: boolean,
): Promise<void> {
  const { error } = await supabase.from("intelligence_rules").update({ enabled }).eq("key", key);
  if (error) throw new Error(`Falha ao atualizar regra: ${error.message}`);
}
