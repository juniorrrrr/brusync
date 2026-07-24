"use client";

import { useActionState, useRef } from "react";
import {
  deleteKnowledgeFileAction,
  type FileActionState,
  getKnowledgeFileDownloadUrlAction,
  uploadKnowledgeFileAction,
} from "@/application/knowledge/knowledgeFilesActions";
import {
  IconDoc,
  IconDownload,
  IconImage,
  IconTrash,
  IconUpload,
  IconVideo,
} from "@/components/ui/icons";
import { KNOWLEDGE_FILE_KIND_LABEL } from "@/domain/knowledge/types";
import type { KnowledgeFile } from "@/types/knowledge";

const INITIAL_STATE: FileActionState = { status: "idle" };

function formatSize(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileKindIcon({ kind }: { kind: KnowledgeFile["kind"] }) {
  if (kind === "imagem") return <IconImage size={20} />;
  if (kind === "video") return <IconVideo size={20} />;
  return <IconDoc size={20} />;
}

export function KnowledgeFileList({
  files,
  documentId,
  showUpload = true,
}: {
  files: KnowledgeFile[];
  documentId: string | null;
  showUpload?: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(async (prev: FileActionState, fd: FormData) => {
    const result = await uploadKnowledgeFileAction(prev, fd);
    if (result.status === "success") formRef.current?.reset();
    return result;
  }, INITIAL_STATE);

  async function handleDownload(file: KnowledgeFile) {
    const result = await getKnowledgeFileDownloadUrlAction(file.id);
    if (result.url) window.open(result.url, "_blank");
  }

  async function handleDelete(file: KnowledgeFile) {
    if (!confirm(`Remover o arquivo "${file.fileName}"?`)) return;
    await deleteKnowledgeFileAction(file.id, file.storagePath, file.documentId);
  }

  return (
    <div>
      {showUpload && (
        <form
          ref={formRef}
          action={formAction}
          style={{ display: "flex", gap: 8, marginBottom: 14 }}
        >
          {documentId && <input type="hidden" name="documentId" value={documentId} />}
          <input type="file" name="file" required />
          <button type="submit" className="btn btn-outline" style={{ display: "flex", gap: 6 }}>
            <IconUpload size={14} /> Enviar
          </button>
        </form>
      )}
      {state.status === "error" && (
        <div className="crm-field-error" style={{ marginBottom: 10 }}>
          {state.message}
        </div>
      )}

      {files.length === 0 ? (
        <p className="crm-card-sub">Nenhum arquivo enviado ainda.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gap: 10,
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          }}
        >
          {files.map((file) => (
            <div key={file.id} className="crm-kb-file-card">
              <FileKindIcon kind={file.kind} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: 13,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {file.fileName}
                </div>
                <div className="crm-card-sub" style={{ margin: 0 }}>
                  {KNOWLEDGE_FILE_KIND_LABEL[file.kind]} · {formatSize(file.fileSize)}
                </div>
              </div>
              <button
                type="button"
                className="crm-icon-btn"
                onClick={() => handleDownload(file)}
                aria-label="Baixar"
              >
                <IconDownload size={15} />
              </button>
              <button
                type="button"
                className="crm-icon-btn"
                onClick={() => handleDelete(file)}
                aria-label="Remover"
              >
                <IconTrash size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
