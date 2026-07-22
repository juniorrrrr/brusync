"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import {
  type ActionState,
  deleteLeadFileAction,
  fetchLeadFiles,
  getFileDownloadUrlAction,
  uploadLeadFileAction,
} from "@/application/crm/leadsActions";
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { IconDownload, IconPaperclip, IconTrash } from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/domain/crm/format";
import type { LeadFile } from "@/types/crm";

const INITIAL_STATE: ActionState = { status: "idle" };
const PREVIEWABLE_IMAGE = /^image\/(png|jpeg|jpg|webp|gif)$/;

function formatFileSize(bytes: number | null) {
  if (bytes == null) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileRow({ file, onDeleted }: { file: LeadFile; onDeleted: (id: string) => void }) {
  const [isPending, startTransition] = useTransition();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const canPreview = file.mimeType ? PREVIEWABLE_IMAGE.test(file.mimeType) : false;

  useEffect(() => {
    if (!canPreview) return;
    let cancelled = false;
    getFileDownloadUrlAction(file.storagePath).then(({ url }) => {
      if (!cancelled && url) setPreviewUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [canPreview, file.storagePath]);

  function handleDownload() {
    startTransition(async () => {
      const { url, error } = await getFileDownloadUrlAction(file.storagePath);
      if (url) window.open(url, "_blank", "noopener,noreferrer");
      else if (error) window.alert(error);
    });
  }

  function handleDelete() {
    if (!window.confirm(`Excluir "${file.fileName}"?`)) return;
    startTransition(async () => {
      await deleteLeadFileAction(file.id, file.storagePath, file.crmLeadId, file.fileName);
      onDeleted(file.id);
    });
  }

  return (
    <div className="crm-file-row">
      {previewUrl ? (
        // biome-ignore lint/performance/noImgElement: signed Supabase Storage URL, not an optimizable static asset
        <img
          src={previewUrl}
          alt={file.fileName}
          style={{ width: 34, height: 34, borderRadius: 9, objectFit: "cover", flexShrink: 0 }}
        />
      ) : (
        <div className="crm-file-ico">
          <IconPaperclip size={16} />
        </div>
      )}
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

export function FilesTab({ crmLeadId }: { crmLeadId: string }) {
  const [files, setFiles] = useState<LeadFile[]>([]);
  const [loading, setLoading] = useState(true);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetchLeadFiles(crmLeadId).then((data) => {
      if (!cancelled) {
        setFiles(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [crmLeadId]);

  const [state, formAction, pending] = useActionState(async (prev: ActionState, fd: FormData) => {
    const result = await uploadLeadFileAction(prev, fd);
    if (result.status === "success") {
      formRef.current?.reset();
      const data = await fetchLeadFiles(crmLeadId);
      setFiles(data);
    }
    return result;
  }, INITIAL_STATE);

  function handleDeleted(id: string) {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }

  if (loading) {
    return (
      <div>
        <Skeleton style={{ height: 70, marginBottom: 16 }} />
        <Skeleton style={{ height: 50, marginBottom: 8 }} />
        <Skeleton style={{ height: 50 }} />
      </div>
    );
  }

  return (
    <div>
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
        <Empty>
          <EmptyMedia variant="icon">📎</EmptyMedia>
          <EmptyTitle>Nenhum arquivo anexado</EmptyTitle>
          <EmptyDescription>Envie contratos, propostas ou outros anexos acima.</EmptyDescription>
        </Empty>
      ) : (
        <div>
          {files.map((file) => (
            <FileRow key={file.id} file={file} onDeleted={handleDeleted} />
          ))}
        </div>
      )}
    </div>
  );
}
