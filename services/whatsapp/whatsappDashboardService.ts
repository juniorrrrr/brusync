import "server-only";

import { getDemoWhatsappAccount, getDemoWhatsappDashboardNumbers } from "@/lib/demo/mockWhatsapp";
import { getAverageResponseMinutes } from "@/repositories/intelligence/crossModuleRepository";
import { getActiveAccount } from "@/repositories/whatsapp/accountsRepository";
import { listConversations } from "@/repositories/whatsapp/conversationsRepository";
import {
  countMessagesByStatus,
  countMessagesSince,
  countTemplateMessagesSince,
} from "@/repositories/whatsapp/messagesRepository";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type { WhatsappDashboardData } from "@/types/whatsapp";

export async function getWhatsappDashboardData(): Promise<WhatsappDashboardData> {
  if (await isDemoModeActive()) {
    const numbers = getDemoWhatsappDashboardNumbers();
    return { account: getDemoWhatsappAccount(), ...numbers };
  }

  const supabase = await getSupabaseAuthClient();
  const account = await getActiveAccount(supabase);
  const since30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    messagesSent,
    messagesReceived,
    templatesSent,
    failures,
    conversations,
    averageResponseMinutes,
  ] = await Promise.all([
    countMessagesSince(supabase, "outbound", since30Days),
    countMessagesSince(supabase, "inbound", since30Days),
    countTemplateMessagesSince(supabase, since30Days),
    countMessagesByStatus(supabase, "falhou"),
    listConversations(supabase, { archivedOnly: false }),
    getAverageResponseMinutes(supabase, since30Days, new Date().toISOString()),
  ]);

  return {
    account,
    messagesSent,
    messagesReceived,
    averageResponseMinutes,
    openConversations: conversations.filter((c) => c.status !== "encerrada").length,
    closedConversations: conversations.filter((c) => c.status === "encerrada").length,
    templatesSent,
    failures,
  };
}
