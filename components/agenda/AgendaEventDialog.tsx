"use client";

import { useActionState } from "react";
import {
  type AgendaEventActionState,
  saveAgendaEventAction,
} from "@/application/agenda/agendaActions";
import { LeadPicker } from "@/components/agenda/LeadPicker";
import { useAgendaEventDialog } from "@/contexts/agenda/AgendaEventDialogContext";
import { AGENDA_EVENT_TYPE_LABEL, AGENDA_EVENT_TYPES } from "@/domain/agenda/types";
import type { OwnerRef } from "@/types/crm";

const INITIAL_STATE: AgendaEventActionState = { status: "idle" };

function toLocalDateTimeInputValue(iso?: string | null): string {
  const date = iso ? new Date(iso) : new Date();
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

export function AgendaEventDialog({
  owners,
  onSaved,
}: {
  owners: OwnerRef[];
  onSaved: () => void;
}) {
  const { mode, event, fixedLeadId, loading, error, close } = useAgendaEventDialog();
  const open = mode !== "closed";

  const [state, formAction] = useActionState(async (prev: AgendaEventActionState, fd: FormData) => {
    const result = await saveAgendaEventAction(prev, fd);
    if (result.status === "success") {
      onSaved();
      close();
    }
    return result;
  }, INITIAL_STATE);

  if (!open) return null;

  return (
    <>
      <button type="button" aria-label="Fechar" className="crm-modal-overlay" onClick={close} />
      <div className="crm-modal-center">
        <div
          className="crm-modal"
          role="dialog"
          aria-modal="true"
          aria-label={mode === "create" ? "Novo evento" : "Editar evento"}
          style={{ maxWidth: 520, overflow: "visible" }}
        >
          <div className="crm-modal-head">
            <span className="crm-modal-title">
              {mode === "create" ? "Novo evento" : "Editar evento"}
            </span>
          </div>

          {loading && <div className="crm-drawer-loading">Carregando…</div>}
          {!loading && error && <div className="crm-drawer-empty">{error}</div>}

          {!loading && !error && (
            <form action={formAction} className="crm-modal-form" style={{ overflow: "visible" }}>
              {event && <input type="hidden" name="id" value={event.id} />}

              {fixedLeadId ? (
                <input type="hidden" name="crmLeadId" value={fixedLeadId} />
              ) : (
                <LeadPicker
                  name="crmLeadId"
                  defaultLeadId={event?.crmLeadId}
                  defaultLeadName={event?.leadName}
                />
              )}

              <div className="crm-field">
                <label htmlFor="agenda-title">Título *</label>
                <input id="agenda-title" name="title" required defaultValue={event?.title ?? ""} />
              </div>

              <div className="crm-field">
                <label htmlFor="agenda-description">Descrição</label>
                <textarea
                  id="agenda-description"
                  name="description"
                  rows={2}
                  defaultValue={event?.description ?? ""}
                />
              </div>

              <div className="crm-composer-row">
                <div className="crm-field">
                  <label htmlFor="agenda-type">Tipo de evento</label>
                  <select
                    id="agenda-type"
                    name="eventType"
                    defaultValue={event?.eventType ?? "ligacao"}
                  >
                    {AGENDA_EVENT_TYPES.map((value) => (
                      <option key={value} value={value}>
                        {AGENDA_EVENT_TYPE_LABEL[value]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="crm-field">
                  <label htmlFor="agenda-duration">Duração (min)</label>
                  <input
                    id="agenda-duration"
                    name="durationMinutes"
                    type="number"
                    min={0}
                    defaultValue={event?.durationMinutes ?? ""}
                  />
                </div>
              </div>

              <div className="crm-field">
                <label htmlFor="agenda-scheduled-at">Data e hora *</label>
                <input
                  id="agenda-scheduled-at"
                  name="scheduledAt"
                  type="datetime-local"
                  required
                  defaultValue={toLocalDateTimeInputValue(event?.scheduledAt)}
                />
              </div>

              <div className="crm-field">
                <label htmlFor="agenda-owner">Responsável</label>
                <select id="agenda-owner" name="ownerId" defaultValue={event?.ownerId ?? ""}>
                  <option value="">Sem responsável</option>
                  {owners.map((owner) => (
                    <option key={owner.id} value={owner.id}>
                      {owner.name || owner.email}
                    </option>
                  ))}
                </select>
              </div>

              {state.status === "error" && <div className="crm-field-error">{state.message}</div>}

              <div className="crm-modal-actions">
                <button type="button" className="btn btn-outline" onClick={close}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-accent">
                  {mode === "create" ? "Criar evento" : "Salvar alterações"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
