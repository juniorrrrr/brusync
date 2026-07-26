import type { Metadata } from "next";
import {
  fetchWhatsappConversationDetail,
  fetchWhatsappConversations,
} from "@/application/whatsapp/whatsappQueries";
import { WhatsappChatThread } from "@/components/whatsapp/WhatsappChatThread";
import { WhatsappConversationInfoPanel } from "@/components/whatsapp/WhatsappConversationInfoPanel";
import { WhatsappConversationList } from "@/components/whatsapp/WhatsappConversationList";
import type { WhatsappConversationStatus } from "@/types/whatsapp";

export const metadata: Metadata = {
  title: "WhatsApp — Brusync OS",
};

export default async function WhatsappPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;

  const data = await fetchWhatsappConversations({
    status: (params.status as WhatsappConversationStatus) || undefined,
    favoritesOnly: params.favorite === "1",
    unreadOnly: params.unread === "1",
    archivedOnly: params.archived === "1",
    ownerId: params.ownerId || undefined,
    search: params.q || undefined,
  });

  const selectedId = params.conversationId ?? data.conversations[0]?.id ?? null;
  const detail = selectedId ? await fetchWhatsappConversationDetail(selectedId) : null;

  return (
    <div className="crm-wa-layout">
      <WhatsappConversationList
        conversations={data.conversations}
        owners={data.owners}
        selectedId={selectedId}
      />
      <WhatsappChatThread conversation={detail} owners={data.owners} />
      <WhatsappConversationInfoPanel conversation={detail} labels={data.labels} />
    </div>
  );
}
