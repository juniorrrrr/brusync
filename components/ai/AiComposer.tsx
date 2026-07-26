"use client";

import { type KeyboardEvent, useState } from "react";
import { IconSend } from "@/components/ui/icons";
import { useAiChat } from "@/contexts/ai/AiChatContext";

export function AiComposer({ initialValue }: { initialValue?: string }) {
  const { sendMessage, isPending } = useAiChat();
  const [value, setValue] = useState(initialValue ?? "");

  function handleSend() {
    if (!value.trim() || isPending) return;
    sendMessage(value);
    setValue("");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="crm-ai-composer">
      <textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Pergunte algo sobre seus leads, clientes, projetos, marketing ou financeiro…"
        rows={2}
        disabled={isPending}
      />
      <button
        type="button"
        className="btn btn-accent"
        onClick={handleSend}
        disabled={isPending || !value.trim()}
      >
        <IconSend size={14} /> Enviar
      </button>
    </div>
  );
}
