"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { deleteLeadAction, moveLeadStageAction } from "@/application/crm/leadsActions";
import { EditLeadModal } from "@/components/crm/leadWorkspace/EditLeadModal";
import { IconDotsHorizontal, IconTrash, IconX } from "@/components/ui/icons";
import { formatCurrencyBRL, initials } from "@/domain/crm/format";
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  function handleStageChange(stageId: string) {
    if (!stageId || stageId === lead.stageId) return;
    startTransition(async () => {
      await moveLeadStageAction(lead.id, stageId);
      onChanged();
    });
  }

  function handleDelete() {
    setMenuOpen(false);
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

  return (
    <div className="crm-ws-header">
      <div className="crm-ws-header-top">
        <div className="crm-ws-identity">
          <div className="crm-lead-avatar">{initials(lead.name)}</div>
          <div style={{ minWidth: 0 }}>
            <div className="crm-ws-name-row">
              <span className="crm-ws-name">{lead.name}</span>
              <span className={`crm-badge ${lead.stage.color}`}>{lead.stage.label}</span>
            </div>
            <div className="crm-ws-subline">
              {lead.company && <span>{lead.company}</span>}
              {lead.jobTitle && <span>· {lead.jobTitle}</span>}
              {lead.city && <span>· {lead.city}</span>}
            </div>
          </div>
        </div>

        <div className="crm-ws-actions">
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

          <div className="crm-dropdown" ref={menuRef}>
            <button
              type="button"
              className="crm-icon-btn"
              aria-label="Mais ações"
              onClick={() => setMenuOpen((v) => !v)}
            >
              <IconDotsHorizontal size={17} />
            </button>
            {menuOpen && (
              <div className="crm-dropdown-menu">
                <button
                  type="button"
                  className="crm-dropdown-item danger"
                  onClick={handleDelete}
                  disabled={isPending}
                >
                  <IconTrash size={14} />
                  Excluir lead
                </button>
              </div>
            )}
          </div>

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
    </div>
  );
}
