"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { getPortalFileDownloadUrlAction } from "@/application/clientPortal/portalFilesActions";
import { IconDownload, IconPaperclip } from "@/components/ui/icons";
import { formatDateTime } from "@/domain/crm/format";
import { usePortalFileUpload } from "@/hooks/clientPortal/usePortalFileUpload";
import type { PortalProjectFile } from "@/types/clientPortal";

function formatFileSize(bytes: number | null) {
  if (bytes == null) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileRow({ file }: { file: PortalProjectFile }) {
  const [isPending, startTransition] = useTransition();

  function handleDownload() {
    startTransition(async () => {
      const { url, error } = await getPortalFileDownloadUrlAction(file.storagePath);
      if (url) window.open(url, "_blank", "noopener,noreferrer");
      else if (error) window.alert(error);
    });
  }

  return (
    <div className="crm-file-row">
      <div className="crm-file-ico">
        <IconPaperclip size={16} />
      </div>
      <div className="crm-file-info">
        <div className="crm-file-name">{file.fileName}</div>
        <div className="crm-file-meta">
          {formatFileSize(file.fileSize)} · {formatDateTime(file.createdAt)}
          {file.uploadedByName ? ` · ${file.uploadedByName}` : ""}
        </div>
      </div>
      <div className="crm-file-actions">
        <button
          type="button"
          className="crm-icon-btn"
          disabled={isPending}
          aria-label="Baixar"
          onClick={handleDownload}
        >
          <IconDownload size={15} />
        </button>
      </div>
    </div>
  );
}

/** "Download de arquivos" + "Upload opcional apenas quando permitido" — no
 * delete here at all: a client can add a file to the conversation, never
 * remove one the team (or they themselves) already sent. */
export function PortalFilesPanel({
  projectId,
  files,
  canUploadFiles,
}: {
  projectId: string;
  files: PortalProjectFile[];
  canUploadFiles: boolean;
}) {
  const router = useRouter();
  const { formRef, state, formAction, pending } = usePortalFileUpload(() => router.refresh());
  const projectLevelFiles = files.filter((f) => !f.taskId);

  return (
    <div>
      {canUploadFiles && (
        <form
          ref={formRef}
          action={formAction}
          className="crm-composer"
          style={{ marginBottom: 16 }}
        >
          <input type="hidden" name="projectId" value={projectId} />
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
      )}

      {projectLevelFiles.length === 0 ? (
        <p className="crm-card-sub">Nenhum arquivo compartilhado ainda.</p>
      ) : (
        <div>
          {projectLevelFiles.map((file) => (
            <FileRow key={file.id} file={file} />
          ))}
        </div>
      )}
    </div>
  );
}
