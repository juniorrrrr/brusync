"use client";

import { useTransition } from "react";
import { deleteAiPromptAction } from "@/application/ai/aiPromptsActions";
import { IconTrash } from "@/components/ui/icons";
import { useAiChat } from "@/contexts/ai/AiChatContext";
import type { AiPrompt } from "@/types/ai";

function DeleteButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  return (
    <button
      type="button"
      className="crm-icon-btn"
      disabled={isPending}
      onClick={() => startTransition(() => void deleteAiPromptAction(id))}
      aria-label="Remover prompt"
    >
      <IconTrash size={13} />
    </button>
  );
}

/** Versão do painel de prompts usada dentro de /ia/chat — clicar em um
 * prompt envia o conteúdo direto como pergunta (useAiChat). Precisa estar
 * dentro de AiChatProvider. */
export function AiPromptsListInteractive({ prompts }: { prompts: AiPrompt[] }) {
  const { sendMessage } = useAiChat();

  if (prompts.length === 0) {
    return <p className="crm-card-sub">Nenhum prompt salvo ainda.</p>;
  }

  return (
    <div className="crm-mini-list">
      {prompts.map((prompt) => (
        <div key={prompt.id} className="crm-ai-prompt-row">
          <button
            type="button"
            className="crm-ai-prompt-button"
            onClick={() => sendMessage(prompt.content)}
          >
            <strong>{prompt.title}</strong>
            {prompt.category && <span className="crm-card-sub"> · {prompt.category}</span>}
          </button>
          <DeleteButton id={prompt.id} />
        </div>
      ))}
    </div>
  );
}
