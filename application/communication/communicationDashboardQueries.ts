import "server-only";

import { requireCrmProfile } from "@/application/crm/authGuard";
import { fetchOwnerOptions } from "@/application/crm/leadsActions";
import {
  getDemoChannels,
  getDemoConversationDetail,
  getDemoConversationSubjectInfo,
  getDemoConversations,
} from "@/lib/demo/mockCommunication";
import { listChannels } from "@/repositories/communication/channelsRepository";
import type { ListConversationsOptions } from "@/repositories/communication/conversationsRepository";
import { listConversations } from "@/repositories/communication/conversationsRepository";
import { getConversationDetail } from "@/services/communication/conversationDetailService";
import { getConversationSubjectInfo } from "@/services/communication/conversationSubjectService";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";

/** Everything the Central de Comunicação inbox page needs, fetched together
 * so the page itself stays a plain Server Component that just renders what
 * it's given — same shape as the Financial dashboard/lançamentos pages. */
export async function getCommunicationInboxPageData(
  filters: ListConversationsOptions,
  selectedConversationId: string | null,
) {
  await requireCrmProfile();

  if (await isDemoModeActive()) {
    const conversations = getDemoConversations(filters);
    const selected = selectedConversationId
      ? getDemoConversationDetail(selectedConversationId)
      : null;
    const subjectInfo = selected
      ? getDemoConversationSubjectInfo(selected.crmLeadId, selected.clientId)
      : null;
    return {
      conversations,
      channels: getDemoChannels(),
      owners: await fetchOwnerOptions(),
      selected,
      subjectInfo,
    };
  }

  const supabase = await getSupabaseAuthClient();
  const [conversations, channels, owners] = await Promise.all([
    listConversations(supabase, filters),
    listChannels(supabase),
    fetchOwnerOptions(),
  ]);

  const selected = selectedConversationId
    ? await getConversationDetail(supabase, selectedConversationId)
    : null;

  const subjectInfo = selected
    ? await getConversationSubjectInfo(supabase, {
        crmLeadId: selected.crmLeadId,
        clientId: selected.clientId,
      })
    : null;

  return { conversations, channels, owners, selected, subjectInfo };
}
