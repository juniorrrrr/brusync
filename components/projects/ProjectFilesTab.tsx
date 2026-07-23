"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import {
  deleteProjectFileAction,
  type FileActionState,
  getProjectFileDownloadUrlAction,
  uploadProjectFileAction,
} from "@/application/projects/projectFilesActions";
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { IconDownload, IconPaperclip, IconTrash } from "@/components/ui/icons";
import { formatDateTime } from "@/domain/crm/format";
import type { ProjectFile } from "@/types/projects";

const INITIAL_STATE: FileActionState = { status: "idle" };

function formatFileSize(bytes: number | null) {
  if (bytes == null) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function ProjectFileRow({
  file,
  onDeleted,
}: {
  file: ProjectFile;
  onDeleted: (id: string) => void;
}) {
  const [isPending, startTransition] = useTransition();

  function handleDownload() {
    startTransition(async () => {
      const { url, error } = await getProjectFileDownloadUrlAction(file.storagePath);
      if (url) window.open(url, "_blank", "noopener,noreferrer");
      else if (error) window.alert(error);
    });
  }

  function handleDelete() {
    if (!window.confirm(`Excluir "${file.fileName}"?`)) return;
    startTransition(async () => {
      const result = await deleteProjectFileAction(file.id, file.storagePath);
      if (result.error) {
        window.alert(result.error);
        return;
      }
      onDeleted(file.id);
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
        <button
          type="button"
          className="crm-icon-btn"
          disabled={isPending}
          aria-label="Remover"
          onClick={handleDelete}
        >
          <IconTrash size={15} />
        </button>
      </div>
    </div>
  );
}

export function ProjectFilesTab({
  projectId,
  files,
  onChanged,
}: {
  projectId: string;
  files: ProjectFile[];
  onChanged: () => void;
}) {
  const [localFiles, setLocalFiles] = useState(files);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    setLocalFiles(files);
  }, [files]);

  const projectLevelFiles = localFiles.filter((f) => !f.taskId);

  const [state, formAction, pending] = useActionState(
    async (prev: FileActionState, fd: FormData) => {
      const result = await uploadProjectFileAction(prev, fd);
      if (result.status === "success") {
        formRef.current?.reset();
        onChanged();
      }
      return result;
    },
    INITIAL_STATE,
  );

  function handleDeleted(id: string) {
    setLocalFiles((prev) => prev.filter((f) => f.id !== id));
    onChanged();
  }

  return (
    <div>
      <form ref={formRef} action={formAction} className="crm-composer">
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

      {projectLevelFiles.length === 0 ? (
        <Empty>
          <EmptyMedia variant="icon">📎</EmptyMedia>
          <EmptyTitle>Nenhum arquivo anexado</EmptyTitle>
          <EmptyDescription>Envie contratos, propostas ou entregáveis acima.</EmptyDescription>
        </Empty>
      ) : (
        <div>
          {projectLevelFiles.map((file) => (
            <ProjectFileRow key={file.id} file={file} onDeleted={handleDeleted} />
          ))}
        </div>
      )}
    </div>
  );
}
