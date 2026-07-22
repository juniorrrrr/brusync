"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  deleteLeadAction,
  moveLeadStageAction,
  reopenLeadAction,
} from "@/application/crm/leadsActions";
import { EditLeadModal } from "@/components/crm/leadWorkspace/EditLeadModal";
import { LostReasonModal } from "@/components/crm/leadWorkspace/LostReasonModal";
import { ProgressRing } from "@/components/crm/ProgressRing";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconDotsHorizontal, IconTrash, IconX } from "@/components/ui/icons";
import { formatCurrencyBRL, initials } from "@/domain/crm/format";
import { LOST_REASON_LABEL } from "@/domain/crm/lostRules";
import type { CrmLeadWithRelations, PipelineStage } from "@/types/crm";

export function WorkspaceHeader({
  lead,
  owners,
  stages,
  onChanged,
  onClose,
}: {
  lead: CrmLeadWithRelations;
  owners: { id: string; name: string | null; email: string | null }[];
  stages: PipelineStage[];
  onChanged: () => void;
  onClose: () => void;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [markingLost, setMarkingLost] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleStageChange(stageId: string) {
    if (!stageId || stageId === lead.stageId) return;
    startTransition(async () => {
      await moveLeadStageAction(lead.id, stageId);
      onChanged();
    });
  }

  function handleDelete() {
    if (
      !window.confirm(`Excluir "${lead.name}" definitivamente? Essa ação não pode ser desfeita.`)
    ) {
      return;
    }
    startTransition(async () => {
      await deleteLeadAction(lead.id);
      onClose();
      router.refresh();
    });
  }

  function handleReopen() {
    startTransition(async () => {
      await reopenLeadAction(lead.id);
      onChanged();
    });
  }

  return (
    <div className="crm-ws-header">
      <div className="crm-ws-header-top">
        <div className="crm-ws-identity">
          <div className="crm-lead-avatar">{initials(lead.name)}</div>
          <div style={{ minWidth: 0 }}>
            <div className="crm-ws-name-row">
              <span className="crm-ws-name">{lead.name}</span>
              <span className={`crm-badge ${lead.stage.color}`}>{lead.stage.label}</span>
              {lead.lostReason && (
                <span className="crm-badge danger">
                  Perdido · {LOST_REASON_LABEL[lead.lostReason]}
                </span>
              )}
            </div>
            <div className="crm-ws-subline">
              {lead.company && <span>{lead.company}</span>}
              {lead.jobTitle && <span>· {lead.jobTitle}</span>}
              {lead.city && <span>· {lead.city}</span>}
            </div>
          </div>
        </div>

        <div className="crm-ws-actions">
          <ProgressRing value={lead.score} size={36} />

          <button type="button" className="btn btn-outline" onClick={() => setEditing(true)}>
            Editar
          </button>

          <select
            className="crm-select"
            value=""
            disabled={isPending}
            onChange={(e) => handleStageChange(e.target.value)}
            aria-label="Mover etapa"
          >
            <option value="">Mover etapa…</option>
            {stages.map((stage) => (
              <option key={stage.id} value={stage.id} disabled={stage.id === lead.stageId}>
                {stage.label}
              </option>
            ))}
          </select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className="crm-icon-btn" aria-label="Mais ações">
                <IconDotsHorizontal size={17} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              style={{ background: "#fff", borderColor: "var(--border)" }}
            >
              {lead.lostReason ? (
                <DropdownMenuItem onClick={handleReopen} disabled={isPending}>
                  Reabrir lead
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => setMarkingLost(true)}>
                  Marcar como perdido
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDelete}
                disabled={isPending}
                style={{ color: "var(--danger)" }}
              >
                <IconTrash size={14} />
                Excluir lead
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <button type="button" className="crm-ws-close" onClick={onClose} aria-label="Fechar">
            <IconX size={18} />
          </button>
        </div>
      </div>

      <div className="crm-ws-meta-row">
        {lead.origin && (
          <span className="crm-ws-meta-item">
            Origem: <strong>{lead.origin}</strong>
          </span>
        )}
        <span className="crm-ws-meta-item">
          Valor potencial: <strong>{formatCurrencyBRL(lead.potentialValue)}</strong>
        </span>
        <span className="crm-ws-meta-item">
          Responsável: <strong>{lead.owner?.name || lead.owner?.email || "Sem responsável"}</strong>
        </span>
        {lead.tags.map((tag) => (
          <span key={tag} className="crm-tag">
            {tag}
          </span>
        ))}
      </div>

      {editing && (
        <EditLeadModal
          lead={lead}
          owners={owners}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            onChanged();
          }}
        />
      )}

      {markingLost && (
        <LostReasonModal
          leadId={lead.id}
          onClose={() => setMarkingLost(false)}
          onDone={() => {
            setMarkingLost(false);
            onChanged();
          }}
        />
      )}
    </div>
  );
}
