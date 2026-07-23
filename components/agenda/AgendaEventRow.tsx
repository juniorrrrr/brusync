"use client";

import { useState } from "react";
import {
  cancelAgendaEventAction,
  completeAgendaEventAction,
  deleteAgendaEventAction,
} from "@/application/agenda/agendaActions";
import { useAgendaEventDialog } from "@/contexts/agenda/AgendaEventDialogContext";
import {
  AGENDA_EVENT_STATUS_BADGE,
  AGENDA_EVENT_STATUS_LABEL,
  AGENDA_EVENT_TYPE_BADGE,
  AGENDA_EVENT_TYPE_LABEL,
} from "@/domain/agenda/types";
import { formatDateTime } from "@/domain/crm/format";
import type { AgendaEvent } from "@/types/agenda";

export function AgendaEventRow({
  event,
  showLead = true,
  onChanged,
}: {
  event: AgendaEvent;
  showLead?: boolean;
  onChanged: () => void;
}) {
  const { openEdit } = useAgendaEventDialog();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOverdue =
    event.status === "agendado" && new Date(event.scheduledAt).getTime() < Date.now();

  async function handleComplete() {
    setBusy(true);
    setError(null);
    const result = await completeAgendaEventAction(event.id);
    if (!result.ok) setError(result.error ?? "Falha ao concluir.");
    onChanged();
    setBusy(false);
  }

  async function handleCancel() {
    setBusy(true);
    setError(null);
    const result = await cancelAgendaEventAction(event.id);
    if (!result.ok) setError(result.error ?? "Falha ao cancelar.");
    onChanged();
    setBusy(false);
  }

  async function handleDelete() {
    setBusy(true);
    setError(null);
    const result = await deleteAgendaEventAction(event.id);
    if (!result.ok) setError(result.error ?? "Falha ao excluir.");
    onChanged();
    setBusy(false);
  }

  return (
    <div className="crm-ag-row">
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span className={`crm-badge ${AGENDA_EVENT_TYPE_BADGE[event.eventType]}`}>
            {AGENDA_EVENT_TYPE_LABEL[event.eventType]}
          </span>
          <strong>{event.title}</strong>
          {isOverdue && (
            <span className="crm-badge danger" style={{ fontSize: 10 }}>
              Atrasado
            </span>
          )}
        </div>
        <div className="crm-ag-desc">
          {formatDateTime(event.scheduledAt)}
          {event.durationMinutes ? ` · ${event.durationMinutes} min` : ""}
          {showLead && event.leadName ? ` · ${event.leadName}` : ""}
          {event.ownerName ? ` · ${event.ownerName}` : ""}
        </div>
        {event.description && <div className="crm-ag-desc">{event.description}</div>}
        {error && (
          <div className="crm-field-error" style={{ marginTop: 4 }}>
            {error}
          </div>
        )}
      </div>

      <div className="crm-ag-row-actions">
        <span className={`crm-badge ${AGENDA_EVENT_STATUS_BADGE[event.status]}`}>
          {AGENDA_EVENT_STATUS_LABEL[event.status]}
        </span>
        {event.status === "agendado" && (
          <>
            <button
              type="button"
              className="crm-ag-action-btn"
              onClick={handleComplete}
              disabled={busy}
            >
              Concluir
            </button>
            <button
              type="button"
              className="crm-ag-action-btn"
              onClick={() => openEdit(event.id)}
              disabled={busy}
            >
              Editar
            </button>
            <button
              type="button"
              className="crm-ag-action-btn danger"
              onClick={handleCancel}
              disabled={busy}
            >
              Cancelar
            </button>
          </>
        )}
        {event.status !== "agendado" && (
          <button
            type="button"
            className="crm-ag-action-btn danger"
            onClick={handleDelete}
            disabled={busy}
          >
            Excluir
          </button>
        )}
      </div>
    </div>
  );
}
