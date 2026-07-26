"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { uploadWhatsappAttachmentAction } from "@/application/whatsapp/whatsappChatActions";
import { IconPaperclip, IconSend } from "@/components/ui/icons";
import { useWhatsappChat } from "@/contexts/whatsapp/WhatsappChatContext";

export function WhatsappComposer() {
  const { conversationId, sendMessage, isPending, error } = useWhatsappChat();
  const [value, setValue] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function handleSend() {
    if (!value.trim() || isPending) return;
    sendMessage(value);
    setValue("");
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    await uploadWhatsappAttachmentAction(conversationId, formData);
    router.refresh();
    event.target.value = "";
  }

  return (
    <div className="crm-comm-composer">
      <div className="crm-comm-composer-row">
        <button
          type="button"
          className="crm-icon-btn"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Anexar arquivo"
        >
          <IconPaperclip size={16} />
        </button>
        <input ref={fileInputRef} type="file" hidden onChange={handleFileChange} />
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Digite uma mensagem…"
          disabled={isPending}
          style={{ flex: 1 }}
        />
        <button
          type="button"
          className="btn btn-accent"
          onClick={handleSend}
          disabled={isPending || !value.trim()}
        >
          <IconSend size={14} />
        </button>
      </div>
      {error && <div className="crm-field-error">{error}</div>}
    </div>
  );
}
