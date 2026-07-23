"use client";

import { useActionState, useRef, useTransition } from "react";
import {
  type DocumentActionState,
  deleteFinancialDocumentAction,
  getFinancialDocumentDownloadUrlAction,
  uploadFinancialDocumentAction,
} from "@/application/financial/financialDocumentsActions";
import { IconDownload, IconPaperclip, IconTrash } from "@/components/ui/icons";
import { formatDateTime } from "@/domain/crm/format";
import { FINANCIAL_DOCUMENT_TYPE_LABEL, FINANCIAL_DOCUMENT_TYPES } from "@/domain/financial/types";
import type { FinancialDocument } from "@/types/financial";

const INITIAL_STATE: DocumentActionState = { status: "idle" };

function formatFileSize(bytes: number | null) {
  if (bytes == null) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function DocumentRow({
  document,
  onDeleted,
}: {
  document: FinancialDocument;
  onDeleted: (id: string) => void;
}) {
  const [isPending, startTransition] = useTransition();

  function handleDownload() {
    startTransition(async () => {
      const { url, error } = await getFinancialDocumentDownloadUrlAction(document.storagePath);
      if (url) window.open(url, "_blank", "noopener,noreferrer");
      else if (error) window.alert(error);
    });
  }

  function handleDelete() {
    if (!window.confirm(`Excluir "${document.fileName}"?`)) return;
    startTransition(async () => {
      const result = await deleteFinancialDocumentAction(document.id, document.storagePath);
      if (result.error) {
        window.alert(result.error);
        return;
      }
      onDeleted(document.id);
    });
  }

  return (
    <div className="crm-file-row">
      <div className="crm-file-ico">
        <IconPaperclip size={16} />
      </div>
      <div className="crm-file-info">
        <div className="crm-file-name">{document.fileName}</div>
        <div className="crm-file-meta">
          {FINANCIAL_DOCUMENT_TYPE_LABEL[document.documentType]} ·{" "}
          {formatFileSize(document.fileSize)} · {formatDateTime(document.createdAt)}
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

/** "Anexar PDF: Contrato, Nota, Comprovante, Recibo" — mirrors
 * ProjectFilesTab (Fase 12) exactly, own bucket (crm-financial-documents). */
export function FinancialDocumentsPanel({
  transactionId,
  documents,
  onChanged,
}: {
  transactionId: string;
  documents: FinancialDocument[];
  onChanged: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  const [state, formAction, pending] = useActionState(
    async (prev: DocumentActionState, fd: FormData) => {
      const result = await uploadFinancialDocumentAction(prev, fd);
      if (result.status === "success") {
        formRef.current?.reset();
        onChanged();
      }
      return result;
    },
    INITIAL_STATE,
  );

  function handleDeleted() {
    onChanged();
  }

  return (
    <div>
      <form ref={formRef} action={formAction} className="crm-composer" style={{ marginBottom: 16 }}>
        <input type="hidden" name="transactionId" value={transactionId} />
        <div className="crm-composer-row">
          <div className="crm-field">
            <label htmlFor="doc-type">Tipo</label>
            <select id="doc-type" name="documentType" defaultValue="outro">
              {FINANCIAL_DOCUMENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {FINANCIAL_DOCUMENT_TYPE_LABEL[type]}
                </option>
              ))}
            </select>
          </div>
          <div className="crm-file-drop">
            <IconPaperclip size={18} />
            <input name="file" type="file" required />
          </div>
        </div>
        {state.status === "error" && <div className="crm-field-error">{state.message}</div>}
        <div className="crm-composer-actions">
          <span className="crm-card-sub" style={{ margin: 0 }}>
            Máx. 15MB
          </span>
          <button type="submit" className="btn btn-accent" disabled={pending}>
            {pending ? "Enviando…" : "Enviar documento"}
          </button>
        </div>
      </form>

      {documents.length === 0 ? (
        <p className="crm-card-sub">Nenhum documento anexado ainda.</p>
      ) : (
        <div>
          {documents.map((document) => (
            <DocumentRow key={document.id} document={document} onDeleted={handleDeleted} />
          ))}
        </div>
      )}
    </div>
  );
}
