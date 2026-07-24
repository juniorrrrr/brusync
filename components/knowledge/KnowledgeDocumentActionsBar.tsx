"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  deleteKnowledgeDocumentAction,
  duplicateKnowledgeDocumentAction,
} from "@/application/knowledge/knowledgeDocumentsActions";

export function KnowledgeDocumentActionsBar({
  documentId,
  canEdit,
  canDelete,
  canDuplicate,
}: {
  documentId: string;
  canEdit: boolean;
  canDelete: boolean;
  canDuplicate: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDuplicate() {
    startTransition(async () => {
      const result = await duplicateKnowledgeDocumentAction(documentId);
      if (result.ok && result.documentId) {
        router.push(`/base-conhecimento/documentos/${result.documentId}`);
      }
    });
  }

  function handleDelete() {
    if (!confirm("Excluir este documento? Ele deixará de aparecer na biblioteca.")) return;
    startTransition(async () => {
      const result = await deleteKnowledgeDocumentAction(documentId);
      if (result.ok) router.push("/base-conhecimento/biblioteca");
    });
  }

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {canEdit && (
        <Link
          href={`/base-conhecimento/documentos/${documentId}/editar`}
          className="btn btn-outline"
        >
          Editar
        </Link>
      )}
      {canDuplicate && (
        <button
          type="button"
          className="btn btn-outline"
          disabled={isPending}
          onClick={handleDuplicate}
        >
          Duplicar
        </button>
      )}
      {canDelete && (
        <button
          type="button"
          className="btn btn-outline"
          disabled={isPending}
          onClick={handleDelete}
        >
          Excluir
        </button>
      )}
    </div>
  );
}
