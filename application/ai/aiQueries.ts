import "server-only";

import { requireCrmProfile } from "@/application/crm/authGuard";
import { getAiChatPageData } from "@/services/ai/aiChatService";
import { getAiDashboardData } from "@/services/ai/aiDashboardService";
import {
  getComercialAssistantSuggestions,
  getFinanceiroAssistantSuggestions,
  getLeadAssistantSuggestions,
  getMarketingAssistantSuggestions,
  getProjetosAssistantSuggestions,
} from "@/services/ai/aiInsightsService";
import type { AiChatPageData, AiDashboardData, AiSuggestion } from "@/types/ai";

/** Wrappers finos, um por tela do módulo de IA — mesmo padrão de
 * application/team/teamQueries.ts e application/performance/
 * performanceQueries.ts: guard de sessão em defesa de profundidade +
 * delega para services/ai/*, que já é 100% ciente de Modo Demonstração. */

export async function fetchAiDashboardData(): Promise<AiDashboardData> {
  await requireCrmProfile();
  return getAiDashboardData();
}

export async function fetchAiChatPageData(conversationId?: string): Promise<AiChatPageData> {
  await requireCrmProfile();
  return getAiChatPageData(conversationId);
}

export async function fetchLeadAssistantSuggestions(
  leadId: string,
): Promise<AiSuggestion[] | null> {
  await requireCrmProfile();
  return getLeadAssistantSuggestions(leadId);
}

export async function fetchMarketingAssistantSuggestions(): Promise<AiSuggestion[]> {
  await requireCrmProfile();
  return getMarketingAssistantSuggestions();
}

export async function fetchComercialAssistantSuggestions(): Promise<AiSuggestion[]> {
  await requireCrmProfile();
  return getComercialAssistantSuggestions();
}

export async function fetchFinanceiroAssistantSuggestions(): Promise<AiSuggestion[]> {
  await requireCrmProfile();
  return getFinanceiroAssistantSuggestions();
}

export async function fetchProjetosAssistantSuggestions(): Promise<AiSuggestion[]> {
  await requireCrmProfile();
  return getProjetosAssistantSuggestions();
}
