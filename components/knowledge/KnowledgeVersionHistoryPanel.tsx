"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { restoreKnowledgeVersionAction } from "@/application/knowledge/knowledgeVersionsActions";
import { KnowledgeBlockRenderer } from "@/components/knowledge/KnowledgeBlockRenderer";
import type { KnowledgeVersion } from "@/types/knowledge";

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function KnowledgeVersionHistoryPanel({
  documentId,
  versions,
}: {
  documentId: string;
  versions: KnowledgeVersion[];
}) {
  const router = useRouter();
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const preview = versions.find((v) => v.id === previewId) ?? null;

  function handleRestore(versionId: string) {
    if (!confirm("Restaurar esta versão? A versão atual será preservada no histórico.")) return;
    startTransition(async () => {
      const result = await restoreKnowledgeVersionAction(documentId, versionId);
      if (!result.ok) {
        setError(result.error ?? "Falha ao restaurar versão.");
        return;
      }
      router.refresh();
    });
  }

  if (versions.length === 0) {
    return <p className="crm-card-sub">Nenhuma versão registrada ainda.</p>;
  }

  return (
    <div>
      {error && (
        <div className="crm-field-error" style={{ marginBottom: 10 }}>
          {error}
        </div>
      )}
      {versions.map((version, index) => (
        <div key={version.id} className="crm-kb-version-row">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 13 }}>
              Versão {version.versionNumber}
              {index === 0 && (
                <span className="crm-badge ok" style={{ marginLeft: 8 }}>
                  Atual
                </span>
              )}
            </div>
            <div className="crm-card-sub" style={{ margin: "2px 0" }}>
              {version.createdByName ?? "—"} · {formatDateTime(version.createdAt)}
            </div>
            {version.changeNote && (
              <div style={{ fontSize: 12.5, color: "var(--muted)" }}>{version.changeNote}</div>
            )}
          </div>
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setPreviewId(previewId === version.id ? null : version.id)}
            >
              {previewId === version.id ? "Ocultar" : "Visualizar"}
            </button>
            {index !== 0 && (
              <button
                type="button"
                className="btn btn-outline"
                disabled={isPending}
                onClick={() => handleRestore(version.id)}
              >
                Restaurar
              </button>
            )}
          </div>
        </div>
      ))}

      {preview && (
        <div className="crm-card crm-card-pad" style={{ marginTop: 12 }}>
          <div className="crm-card-title" style={{ marginBottom: 8 }}>
            {preview.title} — Versão {preview.versionNumber}
          </div>
          <KnowledgeBlockRenderer blocks={preview.contentJson} />
        </div>
      )}
    </div>
  );
}
