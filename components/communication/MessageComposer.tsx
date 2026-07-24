"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  type ConversationActionState,
  sendMessageAction,
} from "@/application/communication/conversationsActions";
import type { MessageTemplate } from "@/types/communication";

const INITIAL_STATE: ConversationActionState = { status: "idle" };

export function MessageComposer({
  conversationId,
  templates,
  onSent,
}: {
  conversationId: string;
  templates: MessageTemplate[];
  onSent: () => void;
}) {
  const [body, setBody] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const [state, formAction] = useActionState(
    async (prev: ConversationActionState, fd: FormData) => {
      const result = await sendMessageAction(prev, fd);
      if (result.status === "success") {
        setBody("");
        onSent();
      }
      return result;
    },
    INITIAL_STATE,
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset the composer whenever the selected conversation changes, not on every render.
  useEffect(() => {
    setBody("");
  }, [conversationId]);

  return (
    <form ref={formRef} action={formAction} className="crm-comm-composer">
      <input type="hidden" name="conversationId" value={conversationId} />

      {templates.length > 0 && (
        <select
          className="crm-select"
          value=""
          onChange={(e) => {
            const template = templates.find((t) => t.id === e.target.value);
            if (template) setBody(template.body);
          }}
          aria-label="Inserir modelo de mensagem"
        >
          <option value="">Inserir modelo…</option>
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name}
            </option>
          ))}
        </select>
      )}

      <div className="crm-comm-composer-row">
        <textarea
          name="body"
          placeholder="Escreva uma mensagem…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          aria-label="Mensagem"
        />
      </div>

      {state.status === "error" && <div className="crm-field-error">{state.message}</div>}

      <div className="crm-comm-composer-row" style={{ justifyContent: "flex-end" }}>
        <button type="submit" name="direction" value="inbound" className="btn btn-outline">
          Registrar mensagem recebida
        </button>
        <button type="submit" name="direction" value="outbound" className="btn btn-accent">
          Enviar
        </button>
      </div>
    </form>
  );
}
