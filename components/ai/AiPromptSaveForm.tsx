"use client";

import { useActionState } from "react";
import { type AiPromptActionState, createAiPromptAction } from "@/application/ai/aiPromptsActions";

const INITIAL_STATE: AiPromptActionState = { status: "idle" };

export function AiPromptSaveForm() {
  const [state, formAction] = useActionState(createAiPromptAction, INITIAL_STATE);

  return (
    <form action={formAction} className="crm-ai-prompt-form">
      <input name="title" placeholder="Título do prompt" required />
      <textarea name="content" placeholder="Pergunta a salvar" rows={2} required />
      <input name="category" placeholder="Categoria (opcional)" />
      <button type="submit" className="btn btn-outline">
        Salvar prompt
      </button>
      {state.status === "error" && <div className="crm-field-error">{state.message}</div>}
    </form>
  );
}
