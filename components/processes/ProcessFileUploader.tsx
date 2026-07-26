"use client";

import { useActionState, useRef } from "react";
import {
  deleteProcessFileAction,
  getProcessFileDownloadUrlAction,
  type ProcessFileActionState,
  uploadProcessFileAction,
} from "@/application/processes/processesAttachmentsActions";
import { IconDoc, IconDownload, IconTrash, IconUpload } from "@/components/ui/icons";
import type { ProcessFile } from "@/types/processes";

const INITIAL_STATE: ProcessFileActionState = { status: "idle" };

function formatSize(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ProcessFileUploader({
  processId,
  files,
}: {
  processId: string;
  files: ProcessFile[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(async (prev: ProcessFileActionState, fd: FormData) => {
    const result = await uploadProcessFileAction(prev, fd);
    if (result.status === "success") formRef.current?.reset();
    return result;
  }, INITIAL_STATE);

  async function handleDownload(file: ProcessFile) {
    const result = await getProcessFileDownloadUrlAction(file.storagePath);
    if (result.url) window.open(result.url, "_blank");
  }

  async function handleDelete(file: ProcessFile) {
    if (!confirm(`Remover o arquivo "${file.fileName}"?`)) return;
    await deleteProcessFileAction(file.id, file.storagePath, processId);
  }

  return (
    <div className="crm-card crm-card-pad">
      <div className="crm-card-title">Arquivos do processo</div>

      <form
        ref={formRef}
        action={formAction}
        style={{ display: "flex", gap: 8, marginTop: 8, marginBottom: 14 }}
      >
        <input type="hidden" name="processId" value={processId} />
        <input type="file" name="file" required />
        <button type="submit" className="btn btn-outline" style={{ display: "flex", gap: 6 }}>
          <IconUpload size={14} /> Enviar
        </button>
      </form>
      {state.status === "error" && (
        <div className="crm-field-error" style={{ marginBottom: 10 }}>
          {state.message}
        </div>
      )}

      {files.length === 0 ? (
        <p className="crm-card-sub">Nenhum arquivo enviado ainda.</p>
      ) : (
        <div className="crm-proc-file-grid">
          {files.map((file) => (
            <div key={file.id} className="crm-proc-file-card">
              <IconDoc size={20} />
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
                  {formatSize(file.fileSize)}
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
