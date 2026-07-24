"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { updateKnowledgeDocumentStatusAction } from "@/application/knowledge/knowledgeDocumentsActions";
import { KNOWLEDGE_STATUS_LABEL, KNOWLEDGE_STATUS_TRANSITIONS } from "@/domain/knowledge/types";
import type { KnowledgeDocumentStatus } from "@/types/knowledge";

export function KnowledgeStatusSelect({
  documentId,
  status,
  canPublish,
}: {
  documentId: string;
  status: KnowledgeDocumentStatus;
  canPublish: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const transitions = (KNOWLEDGE_STATUS_TRANSITIONS[status] ?? []).filter(
    (next) => canPublish || next !== "publicado",
  );
  if (transitions.length === 0) return null;

  function handleChange(next: KnowledgeDocumentStatus) {
    startTransition(async () => {
      await updateKnowledgeDocumentStatusAction(documentId, next, status);
      router.refresh();
    });
  }

  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {transitions.map((next) => (
        <button
          key={next}
          type="button"
          className="btn btn-outline"
          disabled={isPending}
          onClick={() => handleChange(next)}
        >
          {next === "rascunho" && status === "arquivado"
            ? "Reabrir"
            : `Mover para ${KNOWLEDGE_STATUS_LABEL[next]}`}
        </button>
      ))}
    </div>
  );
}
