"use server";

import { fetchLeadAssistantSuggestions } from "@/application/ai/aiQueries";
import type { AiSuggestion } from "@/types/ai";

/** Server Action dedicada — a aba "IA" do Lead Workspace
 * (components/ai/AiLeadAssistantTab.tsx) é um Client Component que busca os
 * dados no useEffect, então precisa de uma Server Action (não uma função
 * "server-only" comum); mesmo padrão de
 * application/playbooks/playbooksActions.ts::fetchLeadPlaybookAction, usado
 * pela aba "Playbook" do mesmo Workspace. */
export async function fetchLeadAssistantAction(leadId: string): Promise<AiSuggestion[] | null> {
  return fetchLeadAssistantSuggestions(leadId);
}
