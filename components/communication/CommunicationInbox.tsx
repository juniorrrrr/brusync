"use client";

import { useRouter } from "next/navigation";
import { ConversationInfoPanel } from "@/components/communication/ConversationInfoPanel";
import { ConversationList } from "@/components/communication/ConversationList";
import { ConversationThread } from "@/components/communication/ConversationThread";
import type {
  Channel,
  Conversation,
  ConversationDetail,
  ConversationSubjectInfo,
  MessageTemplate,
} from "@/types/communication";
import type { OwnerRef } from "@/types/crm";

export function CommunicationInbox({
  conversations,
  channels,
  owners,
  templates,
  selected,
  subjectInfo,
  selectedId,
}: {
  conversations: Conversation[];
  channels: Channel[];
  owners: OwnerRef[];
  templates: MessageTemplate[];
  selected: ConversationDetail | null;
  subjectInfo: ConversationSubjectInfo | null;
  selectedId: string | null;
}) {
  const router = useRouter();

  return (
    <div className="crm-comm-layout">
      <ConversationList
        conversations={conversations}
        channels={channels}
        owners={owners}
        selectedId={selectedId}
      />
      <ConversationThread
        conversation={selected}
        owners={owners}
        templates={templates}
        onChanged={() => router.refresh()}
      />
      <ConversationInfoPanel conversation={selected} subjectInfo={subjectInfo} />
    </div>
  );
}
