import type { AutomationConditionType } from "@/types/automation";

export interface LeadConditionSnapshot {
  origin: string | null;
  score: number;
  stageKey: string | null;
  daysSinceInteraction: number | null;
}

export interface ConditionResult {
  passed: boolean;
  reason: string;
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

/** Pure, side-effect-free rule evaluator — the "CONDIÇÃO" step of the
 * SE → CONDIÇÃO → AÇÃO engine. Takes a snapshot of the lead at the moment a
 * trigger fired and decides whether the workflow's action should run. Kept
 * independent from any Supabase client so it can be unit-tested and reused
 * by both the event-driven path (services/automation/automationEngine.ts)
 * and the scheduled "lead parado" check with the exact same logic. */
export function evaluateCondition(
  conditionType: AutomationConditionType,
  conditionConfig: Record<string, unknown>,
  snapshot: LeadConditionSnapshot,
): ConditionResult {
  switch (conditionType) {
    case "sempre":
      return { passed: true, reason: "Sem condição — sempre executa." };

    case "origem_igual": {
      const expected = typeof conditionConfig.origin === "string" ? conditionConfig.origin : "";
      const matches = Boolean(expected) && normalize(snapshot.origin ?? "") === normalize(expected);
      return {
        passed: matches,
        reason: matches
          ? `Origem "${snapshot.origin}" corresponde a "${expected}".`
          : `Origem "${snapshot.origin ?? "—"}" não corresponde a "${expected}".`,
      };
    }

    case "score_maior_igual": {
      const expected = Number(conditionConfig.score ?? 0);
      const matches = snapshot.score >= expected;
      return {
        passed: matches,
        reason: matches
          ? `Score ${snapshot.score} atende ao mínimo de ${expected}.`
          : `Score ${snapshot.score} é menor que o mínimo de ${expected}.`,
      };
    }

    case "dias_parado_maior_igual": {
      const expected = Number(conditionConfig.days ?? 0);
      const days = snapshot.daysSinceInteraction ?? 0;
      const matches = days >= expected;
      return {
        passed: matches,
        reason: matches
          ? `${days} dias parado atende ao mínimo de ${expected}.`
          : `${days} dias parado é menor que o mínimo de ${expected}.`,
      };
    }

    case "estagio_igual": {
      const expected = typeof conditionConfig.stageKey === "string" ? conditionConfig.stageKey : "";
      const matches = Boolean(expected) && snapshot.stageKey === expected;
      return {
        passed: matches,
        reason: matches
          ? `Estágio atual corresponde a "${expected}".`
          : `Estágio atual ("${snapshot.stageKey ?? "—"}") não corresponde a "${expected}".`,
      };
    }

    default:
      return { passed: false, reason: "Tipo de condição desconhecido." };
  }
}
