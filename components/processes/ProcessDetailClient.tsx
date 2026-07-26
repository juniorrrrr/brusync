"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  archiveProcessAction,
  updateProcessStatusAction,
} from "@/application/processes/processesActions";
import { ApprovalPanel } from "@/components/processes/ApprovalPanel";
import { HistoryTimeline } from "@/components/processes/HistoryTimeline";
import { ProcessCategoryIcon } from "@/components/processes/ProcessCategoryIcon";
import { ProcessDocumentLinker } from "@/components/processes/ProcessDocumentLinker";
import { ProcessFileUploader } from "@/components/processes/ProcessFileUploader";
import { StepsPanel } from "@/components/processes/StepsPanel";
import { IconArchive, IconPencil } from "@/components/ui/icons";
import { useProcessEditor } from "@/contexts/processes/ProcessEditorContext";
import { PROCESS_STATUS_BADGE, PROCESS_STATUS_LABEL } from "@/domain/processes/statusMeta";
import type { ProcessDetail } from "@/types/processes";

function formatMinutes(minutes: number | null): string {
  if (minutes === null) return "—";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest > 0 ? `${hours}h${String(rest).padStart(2, "0")}` : `${hours}h`;
}

export function ProcessDetailClient({ process }: { process: ProcessDetail }) {
  const { openEdit } = useProcessEditor();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function setStatus(status: string) {
    startTransition(async () => {
      await updateProcessStatusAction(process.id, status);
      router.refresh();
    });
  }

  function handleArchive() {
    startTransition(async () => {
      await archiveProcessAction(process.id);
      router.refresh();
    });
  }

  const percent = Math.min(Math.max(process.progressPercent, 0), 100);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="crm-card crm-card-pad">
        <div className="crm-int-card-top">
          <div style={{ display: "flex", gap: 10 }}>
            {process.categoryColor && process.categoryIcon && (
              <ProcessCategoryIcon icon={process.categoryIcon} color={process.categoryColor} />
            )}
            <div>
              <h1 className="crm-page-title" style={{ fontSize: 20 }}>
                {process.name}
              </h1>
              <div className="crm-int-card-desc">
                {process.categoryName ?? "Sem categoria"}
                {process.ownerName ? ` · ${process.ownerName}` : ""}
                {process.templateName ? ` · a partir de "${process.templateName}"` : ""}
              </div>
            </div>
          </div>
          <span className={`crm-badge ${PROCESS_STATUS_BADGE[process.status]}`}>
            {PROCESS_STATUS_LABEL[process.status]}
          </span>
        </div>

        {process.description && (
          <p className="crm-card-sub" style={{ marginTop: 8 }}>
            {process.description}
          </p>
        )}

        <div className="crm-proc-progress-bar" style={{ marginTop: 12 }}>
          <div className="crm-proc-progress-fill" style={{ width: `${percent}%` }} />
        </div>

        <div className="crm-proc-card-meta" style={{ marginTop: 8 }}>
          <span>
            {formatMinutes(process.executedMinutes)} de {formatMinutes(process.estimatedMinutes)}{" "}
            estimado
          </span>
          {process.clientCompany && <span>Cliente: {process.clientCompany}</span>}
          {process.projectName && <span>Projeto: {process.projectName}</span>}
          {process.crmLeadName && <span>Lead: {process.crmLeadName}</span>}
        </div>

        <div className="crm-int-card-actions" style={{ marginTop: 12 }}>
          {process.status === "rascunho" && (
            <button
              type="button"
              className="btn btn-outline"
              disabled={isPending}
              onClick={() => setStatus("ativo")}
            >
              Iniciar processo
            </button>
          )}
          {process.status === "ativo" && (
            <>
              <button
                type="button"
                className="btn btn-outline"
                disabled={isPending}
                onClick={() => setStatus("pausado")}
              >
                Pausar
              </button>
              <button
                type="button"
                className="btn btn-outline"
                disabled={isPending}
                onClick={() => setStatus("concluido")}
              >
                Concluir
              </button>
            </>
          )}
          {process.status === "pausado" && (
            <button
              type="button"
              className="btn btn-outline"
              disabled={isPending}
              onClick={() => setStatus("ativo")}
            >
              Retomar
            </button>
          )}
          <button type="button" className="btn btn-outline" onClick={() => openEdit(process)}>
            <IconPencil size={13} /> Editar
          </button>
          {process.status !== "arquivado" && (
            <button
              type="button"
              className="btn btn-outline"
              disabled={isPending}
              onClick={handleArchive}
            >
              <IconArchive size={13} /> Arquivar
            </button>
          )}
        </div>
      </div>

      <StepsPanel
        processId={process.id}
        steps={process.steps}
        standaloneChecklist={process.standaloneChecklist}
      />
      <ApprovalPanel processId={process.id} approvals={process.approvals} />
      <ProcessDocumentLinker processId={process.id} documents={process.documents} />
      <ProcessFileUploader processId={process.id} files={process.files} />

      <div className="crm-card crm-card-pad">
        <div className="crm-card-title">Histórico</div>
        <div style={{ marginTop: 8 }}>
          <HistoryTimeline entries={process.history} />
        </div>
      </div>
    </div>
  );
}
