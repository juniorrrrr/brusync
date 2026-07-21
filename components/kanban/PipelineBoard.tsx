"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { moveLeadStageAction } from "@/application/crm/leadsActions";
import { useLeadDrawer } from "@/contexts/crm/LeadDrawerContext";
import { formatCurrencyBRL, formatDate, initials } from "@/domain/crm/format";
import type { CrmLeadWithRelations, PipelineColumn } from "@/types/crm";

export function PipelineBoard({ initialColumns }: { initialColumns: PipelineColumn[] }) {
  const [columns, setColumns] = useState(initialColumns);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const { openLead } = useLeadDrawer();
  const router = useRouter();
  const [, startTransition] = useTransition();

  function handleDrop(stageId: string) {
    setDragOverStage(null);
    const leadId = draggingId;
    setDraggingId(null);
    if (!leadId) return;

    // Read current state synchronously to decide whether a move is needed —
    // a flag set *inside* the setColumns updater can't be read right after
    // calling setColumns, because that updater runs during React's next
    // render pass, not synchronously in this function.
    const currentLead = columns.flatMap((col) => col.leads).find((l) => l.id === leadId);
    if (!currentLead || currentLead.stageId === stageId) return;

    setColumns((prev) => {
      const updatedLead: CrmLeadWithRelations = { ...currentLead, stageId };
      const withoutLead = prev.map((col) => ({
        ...col,
        leads: col.leads.filter((l) => l.id !== leadId),
      }));
      return withoutLead.map((col) =>
        col.stage.id === stageId ? { ...col, leads: [updatedLead, ...col.leads] } : col,
      );
    });

    startTransition(async () => {
      const result = await moveLeadStageAction(leadId, stageId);
      if (!result.ok) router.refresh();
    });
  }

  return (
    <div className="crm-kanban">
      {columns.map((column) => (
        // biome-ignore lint/a11y/noStaticElementInteractions: HTML5 drag-and-drop drop zone; no accessible keyboard equivalent exists for reordering in this phase.
        <div
          key={column.stage.id}
          className={`crm-kanban-col${dragOverStage === column.stage.id ? " drag-over" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOverStage(column.stage.id);
          }}
          onDragLeave={() =>
            setDragOverStage((current) => (current === column.stage.id ? null : current))
          }
          onDrop={() => handleDrop(column.stage.id)}
        >
          <div className="crm-kanban-col-head">
            <span className="crm-kanban-col-title">{column.stage.label}</span>
            <span className="crm-kanban-count">{column.leads.length}</span>
          </div>
          {column.leads.map((lead) => (
            <div
              key={lead.id}
              className={`crm-kanban-card${draggingId === lead.id ? " dragging" : ""}`}
              draggable
              role="button"
              tabIndex={0}
              onDragStart={() => setDraggingId(lead.id)}
              onDragEnd={() => setDraggingId(null)}
              onClick={() => openLead(lead.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openLead(lead.id);
                }
              }}
            >
              <div className="crm-kanban-card-title">{lead.name}</div>
              <div className="crm-kanban-card-meta">
                {lead.company || "Sem empresa"} · {formatDate(lead.createdAt)}
              </div>
              <div className="crm-kanban-card-foot">
                <span className="cell-muted" style={{ fontSize: 11.5 }}>
                  {formatCurrencyBRL(lead.potentialValue)}
                </span>
                {lead.owner && (
                  <span className="crm-avatar crm-kanban-owner">
                    {initials(lead.owner.name || lead.owner.email)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
