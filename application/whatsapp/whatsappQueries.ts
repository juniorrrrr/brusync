import "server-only";

import { requireCrmProfile } from "@/application/crm/authGuard";
import { getDemoWhatsappWebhookLogs } from "@/lib/demo/mockWhatsapp";
import type { ListConversationsOptions } from "@/repositories/whatsapp/conversationsRepository";
import { listRecentWebhookLogs } from "@/repositories/whatsapp/webhooksRepository";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import { getWhatsappAccount } from "@/services/whatsapp/whatsappAccountService";
import { getAutomationsPageData } from "@/services/whatsapp/whatsappAutomationService";
import {
  getConversationDetail,
  getConversationsPageData,
} from "@/services/whatsapp/whatsappChatService";
import { getWhatsappDashboardData } from "@/services/whatsapp/whatsappDashboardService";
import { getTemplates } from "@/services/whatsapp/whatsappTemplatesService";
import type {
  WhatsappAccount,
  WhatsappAutomationsPageData,
  WhatsappConversationDetail,
  WhatsappConversationsPageData,
  WhatsappDashboardData,
  WhatsappTemplate,
  WhatsappWebhookLogEntry,
} from "@/types/whatsapp";

/** Wrappers finos, um por tela do módulo — mesmo padrão de
 * application/team/teamQueries.ts, application/ai/aiQueries.ts e
 * application/analytics/analyticsQueries.ts: guard de sessão + delega para
 * services/whatsapp/*, que já é 100% ciente de Modo Demonstração. */

export async function fetchWhatsappAccount(): Promise<WhatsappAccount | null> {
  await requireCrmProfile();
  return getWhatsappAccount();
}

export async function fetchWhatsappConversations(
  options: ListConversationsOptions = {},
): Promise<WhatsappConversationsPageData> {
  await requireCrmProfile();
  return getConversationsPageData(options);
}

export async function fetchWhatsappConversationDetail(
  id: string,
): Promise<WhatsappConversationDetail | null> {
  await requireCrmProfile();
  return getConversationDetail(id);
}

export async function fetchWhatsappDashboardData(): Promise<WhatsappDashboardData> {
  await requireCrmProfile();
  return getWhatsappDashboardData();
}

export async function fetchWhatsappTemplates(): Promise<WhatsappTemplate[]> {
  await requireCrmProfile();
  return getTemplates();
}

export async function fetchWhatsappAutomations(): Promise<WhatsappAutomationsPageData> {
  await requireCrmProfile();
  return getAutomationsPageData();
}

export async function fetchWhatsappWebhookLogs(): Promise<WhatsappWebhookLogEntry[]> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return getDemoWhatsappWebhookLogs();
  const supabase = await getSupabaseAuthClient();
  return listRecentWebhookLogs(supabase);
}
