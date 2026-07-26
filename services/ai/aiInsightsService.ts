import "server-only";

import { buildComercialInsights } from "@/domain/ai/insights/comercialInsights";
import { buildFinanceiroInsights } from "@/domain/ai/insights/financeiroInsights";
import { buildLeadInsights } from "@/domain/ai/insights/leadInsights";
import { buildMarketingInsights } from "@/domain/ai/insights/marketingInsights";
import { buildProjetosInsights } from "@/domain/ai/insights/projetosInsights";
import type { AiSuggestionDraft } from "@/domain/ai/suggestionDraft";
import { logSuggestion } from "@/repositories/ai/suggestionsRepository";
import {
  buildComercialAssistantContext,
  buildFinanceiroAssistantContext,
  buildLeadAssistantContext,
  buildMarketingAssistantContext,
  buildProjetosAssistantContext,
} from "@/services/ai/aiContextService";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type { AiSuggestion } from "@/types/ai";

/** Materializa um AiSuggestionDraft (domain/ai/insights/*.ts) em AiSuggestion
 * para exibição — em modo real também grava o log em ai_suggestions
 * (histórico de "Sugestões geradas" do dashboard); em Modo Demonstração só
 * exibe, nunca escreve. */
async function materialize(drafts: AiSuggestionDraft[]): Promise<AiSuggestion[]> {
  const now = new Date().toISOString();
  const demo = await isDemoModeActive();
  const supabase = demo ? null : await getSupabaseAuthClient();

  const results: AiSuggestion[] = [];
  for (const draft of drafts) {
    if (supabase) {
      await logSuggestion(supabase, draft);
    }
    results.push({
      id: `${draft.type}-${draft.contextRef ?? draft.module}-${results.length}`,
      ...draft,
      isFavorite: false,
      createdAt: now,
    });
  }
  return results;
}

export async function getLeadAssistantSuggestions(leadId: string): Promise<AiSuggestion[] | null> {
  const input = await buildLeadAssistantContext(leadId);
  if (!input) return null;
  return materialize(buildLeadInsights(input));
}

export async function getMarketingAssistantSuggestions(): Promise<AiSuggestion[]> {
  const input = await buildMarketingAssistantContext();
  return materialize(buildMarketingInsights(input));
}

export async function getComercialAssistantSuggestions(): Promise<AiSuggestion[]> {
  const input = await buildComercialAssistantContext();
  return materialize(buildComercialInsights(input));
}

export async function getFinanceiroAssistantSuggestions(): Promise<AiSuggestion[]> {
  const input = await buildFinanceiroAssistantContext();
  return materialize(buildFinanceiroInsights(input));
}

export async function getProjetosAssistantSuggestions(): Promise<AiSuggestion[]> {
  const input = await buildProjetosAssistantContext();
  return materialize(buildProjetosInsights(input));
}
