import "server-only";

import { getOwnerOptions } from "@/application/crm/leadsQueries";
import {
  getDemoAiConversations,
  getDemoAiFeedback,
  getDemoAiSuggestionsLog,
  getDemoAiUsageCountLast30Days,
} from "@/lib/demo/mockAi";
import { listConversations } from "@/repositories/ai/conversationsRepository";
import { countMessages } from "@/repositories/ai/messagesRepository";
import { listSuggestions } from "@/repositories/ai/suggestionsRepository";
import { countUsageSince } from "@/repositories/ai/usageRepository";
import {
  getAiFavoriteMessages,
  getAiPrompts,
  getAiRecentQuestions,
} from "@/services/ai/aiChatService";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type { AiDashboardData } from "@/types/ai";

export async function getAiDashboardData(): Promise<AiDashboardData> {
  const demo = await isDemoModeActive();
  const [recentQuestions, prompts, favorites, ownerOptions] = await Promise.all([
    getAiRecentQuestions(8),
    getAiPrompts(),
    getAiFavoriteMessages(),
    getOwnerOptions(),
  ]);

  if (demo) {
    const suggestions = getDemoAiSuggestionsLog();
    const feedback = getDemoAiFeedback();
    const conversations = getDemoAiConversations();
    return {
      summary: {
        totalConversations: conversations.length,
        totalMessages: recentQuestions.length * 2,
        totalSuggestions: suggestions.length,
        totalFavorites: favorites.length,
        totalPrompts: prompts.length,
        usageLast30Days: getDemoAiUsageCountLast30Days() + feedback.length,
      },
      recentQuestions,
      suggestions,
      history: conversations,
      favorites,
      prompts,
      ownerOptions,
    };
  }

  const supabase = await getSupabaseAuthClient();
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const [conversations, totalMessages, suggestions, usageLast30Days] = await Promise.all([
    listConversations(supabase, { status: "ativa", limit: 10 }),
    countMessages(supabase),
    listSuggestions(supabase, { limit: 15 }),
    countUsageSince(supabase, since),
  ]);

  return {
    summary: {
      totalConversations: conversations.length,
      totalMessages,
      totalSuggestions: suggestions.length,
      totalFavorites: favorites.length,
      totalPrompts: prompts.length,
      usageLast30Days,
    },
    recentQuestions,
    suggestions,
    history: conversations,
    favorites,
    prompts,
    ownerOptions,
  };
}
