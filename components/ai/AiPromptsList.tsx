"use client";

import { useTransition } from "react";
import { deleteAiPromptAction } from "@/application/ai/aiPromptsActions";
import { IconTrash } from "@/components/ui/icons";
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

/** Lista somente leitura de prompts salvos (dashboard). Para a versão
 * clicável que envia o prompt direto para o chat, ver
 * components/ai/AiPromptsListInteractive.tsx — mantidas separadas porque
 * essa depende de AiChatProvider e esta não. */
export function AiPromptsList({ prompts }: { prompts: AiPrompt[] }) {
  if (prompts.length === 0) {
    return <p className="crm-card-sub">Nenhum prompt salvo ainda.</p>;
  }

  return (
    <div className="crm-mini-list">
      {prompts.map((prompt) => (
        <div key={prompt.id} className="crm-ai-prompt-row">
          <div>
            <strong>{prompt.title}</strong>
            {prompt.category && <span className="crm-card-sub"> · {prompt.category}</span>}
          </div>
          <DeleteButton id={prompt.id} />
        </div>
      ))}
    </div>
  );
}
