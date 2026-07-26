import type { Metadata } from "next";
import { fetchAiChatPageData } from "@/application/ai/aiQueries";
import { AiChatWindow } from "@/components/ai/AiChatWindow";
import { AiConversationHistoryList } from "@/components/ai/AiConversationHistoryList";
import { AiPromptSaveForm } from "@/components/ai/AiPromptSaveForm";
import { AiPromptsListInteractive } from "@/components/ai/AiPromptsListInteractive";
import { AiChatProvider } from "@/contexts/ai/AiChatContext";

export const metadata: Metadata = {
  title: "Chat — IA — Brusync OS",
};

export default async function IaChatPage({
  searchParams,
}: {
  searchParams: Promise<{ conversationId?: string }>;
}) {
  const { conversationId } = await searchParams;
  const data = await fetchAiChatPageData(conversationId);

  return (
    <AiChatProvider
      initialConversationId={data.activeConversation?.id ?? null}
      initialMessages={data.activeConversation?.messages ?? []}
      contextType={data.activeConversation?.contextType ?? "geral"}
      contextRef={data.activeConversation?.contextRef ?? null}
    >
      <div className="crm-ai-chat-layout">
        <aside className="crm-ai-chat-sidebar">
          <div className="crm-card crm-card-pad">
            <div className="crm-card-title">Prompts salvos</div>
            <AiPromptsListInteractive prompts={data.prompts} />
            <AiPromptSaveForm />
          </div>
          <div className="crm-card crm-card-pad">
            <div className="crm-card-title">Conversas</div>
            <AiConversationHistoryList conversations={data.conversations} />
          </div>
        </aside>
        <div className="crm-ai-chat-main">
          <AiChatWindow />
        </div>
      </div>
    </AiChatProvider>
  );
}
