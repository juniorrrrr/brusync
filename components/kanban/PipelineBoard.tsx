"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { moveLeadStageAction } from "@/application/crm/leadsActions";
import { ProgressRing } from "@/components/crm/ProgressRing";
import { IconClock } from "@/components/ui/icons";
import { useLeadDrawer } from "@/contexts/crm/LeadDrawerContext";
import {
  formatCurrencyBRL,
  formatDate,
  formatDaysStuck,
  formatRelativeToNow,
  initials,
} from "@/domain/crm/format";
import { LEAD_PRIORITY_LABEL, leadPriorityTone, priorityFromScore } from "@/domain/crm/scoreRules";
import type { CrmLeadWithPipelineInfo, PipelineColumn } from "@/types/crm";

function isOverdue(dueAt: string | null) {
  return !!dueAt && new Date(dueAt).getTime() < Date.now();
}

export function PipelineBoard({ initialColumns }: { initialColumns: PipelineColumn[] }) {
  const [columns, setColumns] = useState(initialColumns);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const { openLead } = useLeadDrawer();
  const router = useRouter();
  const [, startTransition] = useTransition();

  // Re-sync with the server-fetched columns whenever the parent Server
  // Component re-renders with fresh data (router.refresh() after creating a
  // lead, moving a stage, etc.) — a plain useState(initialColumns) only reads
  // the prop on mount and would otherwise leave the board stale.
  useEffect(() => {
    setColumns(initialColumns);
  }, [initialColumns]);

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
      const updatedLead: CrmLeadWithPipelineInfo = {
        ...currentLead,
        stageId,
        stageEnteredAt: new Date().toISOString(),
      };
      const withoutLead = prev.map((col) => ({
        ...col,
        leads: col.leads.filter((l) => l.id !== leadId),
      }));
      return withoutLead.map((col) =>
        col.stage.id === stageId ? { ...col, leads: [updatedLead, ...col.leads] } : col,
      );
    });

    startTransition(async () => {
      // Always refresh: moving a stage triggers server-side automation (task
      // creation, score recalculation, client auto-creation on Venda) whose
      // effects the optimistic local update above can't reflect.
      await moveLeadStageAction(leadId, stageId);
      router.refresh();
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
          {column.leads.map((lead) => {
            const priority = priorityFromScore(lead.score);
            const tone = leadPriorityTone(lead.score);
            const stuckSince = lead.stageEnteredAt ?? lead.createdAt;
            const stuckDays = formatDaysStuck(stuckSince);
            const isStuckTooLong =
              Math.floor((Date.now() - new Date(stuckSince).getTime()) / 86_400_000) > 15;
            const nextTaskOverdue = isOverdue(lead.nextTask?.dueAt ?? null);

            return (
              <div
                key={lead.id}
                className={`crm-kanban-card tone-${tone}${draggingId === lead.id ? " dragging" : ""}`}
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
                <div className="crm-kanban-card-top">
                  <div>
                    <div className="crm-kanban-card-title">{lead.name}</div>
                    <div className="crm-kanban-card-meta">
                      {lead.company || "Sem empresa"}
                      {lead.jobTitle ? ` · ${lead.jobTitle}` : ""}
                    </div>
                  </div>
                  <ProgressRing value={lead.score} size={30} />
                </div>

                <div className="crm-kanban-card-row">
                  <span className="cell-muted" style={{ fontSize: 11.5 }}>
                    {lead.city || "Sem cidade"}
                  </span>
                  {lead.origin && (
                    <span className="crm-badge neutral" style={{ fontSize: 10 }}>
                      {lead.origin}
                    </span>
                  )}
                  <span className={`crm-badge ${tone}`} style={{ fontSize: 10 }}>
                    Prioridade {LEAD_PRIORITY_LABEL[priority]}
                  </span>
                </div>

                {lead.tags.length > 0 && (
                  <div className="crm-kanban-card-tags">
                    {lead.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="crm-tag">
                        {tag}
                      </span>
                    ))}
                    {lead.tags.length > 3 && (
                      <span className="crm-tag">+{lead.tags.length - 3}</span>
                    )}
                  </div>
                )}

                {lead.nextTask && (
                  <div
                    className={`crm-badge ${nextTaskOverdue ? "danger" : "info"}`}
                    style={{ marginTop: 8, width: "100%", justifyContent: "flex-start" }}
                  >
                    <IconClock size={12} />
                    {lead.nextTask.title}
                    {lead.nextTask.dueAt ? ` · ${formatDate(lead.nextTask.dueAt)}` : ""}
                    {nextTaskOverdue ? " · Atrasado" : ""}
                  </div>
                )}

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

                <div className="crm-kanban-card-foot2">
                  <span className={`stuck${isStuckTooLong ? " overdue" : ""}`}>
                    Parado há {stuckDays}
                  </span>
                  <span>
                    {lead.lastInteractionAt
                      ? `Última atividade ${formatRelativeToNow(lead.lastInteractionAt)}`
                      : "Sem atividade"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
