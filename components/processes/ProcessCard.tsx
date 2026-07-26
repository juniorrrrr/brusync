"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { archiveProcessAction } from "@/application/processes/processesActions";
import { ProcessCategoryIcon } from "@/components/processes/ProcessCategoryIcon";
import { IconArchive, IconPencil } from "@/components/ui/icons";
import { useProcessEditor } from "@/contexts/processes/ProcessEditorContext";
import { PROCESS_STATUS_BADGE, PROCESS_STATUS_LABEL } from "@/domain/processes/statusMeta";
import type { ProcessSummary } from "@/types/processes";

function formatMinutes(minutes: number | null): string {
  if (minutes === null) return "—";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest > 0 ? `${hours}h${String(rest).padStart(2, "0")}` : `${hours}h`;
}

export function ProcessCard({ process }: { process: ProcessSummary }) {
  const { openEdit } = useProcessEditor();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleArchive() {
    startTransition(async () => {
      await archiveProcessAction(process.id);
      router.refresh();
    });
  }

  const percent = Math.min(Math.max(process.progressPercent, 0), 100);

  return (
    <div className="crm-card crm-card-pad crm-proc-card">
      <div className="crm-int-card-top">
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          {process.categoryColor && process.categoryIcon && (
            <ProcessCategoryIcon icon={process.categoryIcon} color={process.categoryColor} />
          )}
          <div>
            <Link href={`/processos/${process.id}`} className="crm-proc-card-title">
              {process.name}
            </Link>
            <div className="crm-int-card-desc">
              {process.categoryName ?? "Sem categoria"}
              {process.ownerName ? ` · ${process.ownerName}` : ""}
            </div>
          </div>
        </div>
        <span className={`crm-badge ${PROCESS_STATUS_BADGE[process.status]}`}>
          {PROCESS_STATUS_LABEL[process.status]}
        </span>
      </div>

      <div className="crm-proc-progress-bar">
        <div className="crm-proc-progress-fill" style={{ width: `${percent}%` }} />
      </div>

      <div className="crm-proc-card-meta">
        <span>
          {process.checklistTotal > 0
            ? `${process.checklistDoneCount}/${process.checklistTotal} checklist`
            : process.stepCount > 0
              ? `${process.stepsDoneCount}/${process.stepCount} etapas`
              : "Sem checklist"}
        </span>
        <span>
          {formatMinutes(process.executedMinutes)} de {formatMinutes(process.estimatedMinutes)}
        </span>
        {process.pendingApprovalCount > 0 && (
          <span className="crm-badge warn">{process.pendingApprovalCount} aprovação pendente</span>
        )}
      </div>

      <div className="crm-int-card-actions">
        <Link href={`/processos/${process.id}`} className="btn btn-outline">
          Ver detalhes
        </Link>
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
  );
}
