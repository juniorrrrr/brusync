"use client";

import { useState } from "react";
import { IconCheck, IconClock, IconPaperclip, IconSend, IconStar } from "@/components/ui/icons";
import { useAiChat } from "@/contexts/ai/AiChatContext";
import { useAiFeedback } from "@/hooks/ai/useAiFeedback";
import { useAiMessageFavorite } from "@/hooks/ai/useAiMessageFavorite";
import type { AiMessage } from "@/types/ai";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function AiMessageBubble({ message }: { message: AiMessage }) {
  const { regenerate } = useAiChat();
  const { favorite, toggle } = useAiMessageFavorite(message.id, message.isFavorite);
  const { rating, submit } = useAiFeedback("message", message.id);
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className={`crm-ai-bubble ${message.role}`}>
      <div className="crm-ai-bubble-content">{message.content}</div>
      <div className="crm-ai-bubble-meta">
        <span className="crm-card-sub">
          <IconClock size={11} /> {formatTime(message.createdAt)}
        </span>

        {message.role === "assistant" && (
          <div className="crm-ai-bubble-actions">
            <button
              type="button"
              className="crm-icon-btn"
              onClick={handleCopy}
              aria-label="Copiar resposta"
            >
              {copied ? <IconCheck size={13} /> : <IconPaperclip size={13} />}
            </button>
            <button
              type="button"
              className="crm-icon-btn"
              onClick={() => regenerate(message.id)}
              aria-label="Regenerar resposta"
            >
              <IconSend size={13} />
            </button>
            <button
              type="button"
              className={`crm-icon-btn crm-ai-fav-btn${favorite ? " active" : ""}`}
              onClick={toggle}
              aria-pressed={favorite}
              aria-label="Favoritar resposta"
            >
              <IconStar size={13} />
            </button>
            <button
              type="button"
              className={`crm-ai-feedback-btn${rating === "positivo" ? " active" : ""}`}
              onClick={() => submit("positivo")}
              aria-label="Feedback positivo"
            >
              👍
            </button>
            <button
              type="button"
              className={`crm-ai-feedback-btn${rating === "negativo" ? " active" : ""}`}
              onClick={() => submit("negativo")}
              aria-label="Feedback negativo"
            >
              👎
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
