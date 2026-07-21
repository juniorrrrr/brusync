"use client";

import { useActionState, useRef, useTransition } from "react";
import {
  type ActionState,
  deleteLeadFileAction,
  getFileDownloadUrlAction,
  uploadLeadFileAction,
} from "@/application/crm/leadsActions";
import { IconDownload, IconPaperclip, IconTrash } from "@/components/ui/icons";
import { formatDateTime } from "@/domain/crm/format";
import type { LeadFile } from "@/types/crm";

const INITIAL_STATE: ActionState = { status: "idle" };

function formatFileSize(bytes: number | null) {
  if (bytes == null) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function LeadDrawerFiles({
  crmLeadId,
  files,
  onChanged,
}: {
  crmLeadId: string;
  files: LeadFile[];
  onChanged: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [state, formAction, pending] = useActionState(async (prev: ActionState, fd: FormData) => {
    const result = await uploadLeadFileAction(prev, fd);
    if (result.status === "success") {
      formRef.current?.reset();
      onChanged();
    }
    return result;
  }, INITIAL_STATE);

  function handleDownload(storagePath: string) {
    startTransition(async () => {
      const { url, error } = await getFileDownloadUrlAction(storagePath);
      if (url) window.open(url, "_blank", "noopener,noreferrer");
      else if (error) window.alert(error);
    });
  }

  function handleDelete(fileId: string, storagePath: string) {
    startTransition(async () => {
      await deleteLeadFileAction(fileId, storagePath);
      onChanged();
    });
  }

  return (
    <div className="crm-drawer-section" style={{ marginTop: 0, paddingTop: 0, borderTop: "none" }}>
      <form ref={formRef} action={formAction} className="crm-composer">
        <input type="hidden" name="crmLeadId" value={crmLeadId} />
        <div className="crm-file-drop">
          <IconPaperclip size={18} />
          <input name="file" type="file" required />
        </div>
        {state.status === "error" && <div className="crm-field-error">{state.message}</div>}
        <div className="crm-composer-actions">
          <span className="crm-card-sub" style={{ margin: 0 }}>
            Máx. 15MB
          </span>
          <button type="submit" className="btn btn-accent" disabled={pending}>
            {pending ? "Enviando…" : "Enviar arquivo"}
          </button>
        </div>
      </form>

      {files.length === 0 ? (
        <p className="crm-card-sub">Nenhum arquivo anexado.</p>
      ) : (
        <div>
          {files.map((file) => (
            <div key={file.id} className="crm-file-row">
              <div className="crm-file-ico">
                <IconPaperclip size={16} />
              </div>
              <div className="crm-file-info">
                <div className="crm-file-name">{file.fileName}</div>
                <div className="crm-file-meta">
                  {formatFileSize(file.fileSize)} · {formatDateTime(file.createdAt)}
                </div>
              </div>
              <div className="crm-file-actions">
                <button
                  type="button"
                  className="crm-icon-btn"
                  disabled={isPending}
                  aria-label="Baixar"
                  onClick={() => handleDownload(file.storagePath)}
                >
                  <IconDownload size={15} />
                </button>
                <button
                  type="button"
                  className="crm-icon-btn"
                  disabled={isPending}
                  aria-label="Remover"
                  onClick={() => handleDelete(file.id, file.storagePath)}
                >
                  <IconTrash size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
