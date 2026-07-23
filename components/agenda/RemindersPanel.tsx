"use client";

import { useActionState, useEffect, useState } from "react";
import {
  createReminderAction,
  fetchReminders,
  type ReminderActionState,
  updateReminderStatusAction,
} from "@/application/agenda/remindersActions";
import { formatDateTime } from "@/domain/crm/format";
import type { AgendaReminder } from "@/types/agenda";

const INITIAL_STATE: ReminderActionState = { status: "idle" };

export function RemindersPanel() {
  const [reminders, setReminders] = useState<AgendaReminder[]>([]);
  const [loading, setLoading] = useState(true);

  function reload() {
    setLoading(true);
    fetchReminders({ status: "pendente", limit: 10 })
      .then(setReminders)
      .finally(() => setLoading(false));
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: reload is intentionally not memoized — this effect only needs to run once, on mount.
  useEffect(() => {
    reload();
  }, []);

  const [state, formAction] = useActionState(async (prev: ReminderActionState, fd: FormData) => {
    const result = await createReminderAction(prev, fd);
    if (result.status === "success") reload();
    return result;
  }, INITIAL_STATE);

  async function handleComplete(id: string) {
    await updateReminderStatusAction(id, "concluido");
    reload();
  }

  return (
    <div className="crm-card crm-card-pad">
      <div className="crm-card-title">Lembretes</div>
      {loading && <p className="crm-card-sub">Carregando…</p>}
      {!loading && reminders.length === 0 && (
        <p className="crm-card-sub" style={{ marginTop: 8 }}>
          Nenhum lembrete pendente.
        </p>
      )}
      {!loading &&
        reminders.map((reminder) => (
          <div key={reminder.id} className="crm-ag-row" style={{ padding: "8px 0" }}>
            <div>
              <div style={{ fontSize: 13 }}>{reminder.message}</div>
              <div className="crm-card-sub">
                {formatDateTime(reminder.remindAt)}
                {reminder.leadName ? ` · ${reminder.leadName}` : ""}
              </div>
            </div>
            <button
              type="button"
              className="crm-ag-action-btn"
              onClick={() => handleComplete(reminder.id)}
            >
              Concluir
            </button>
          </div>
        ))}

      <form
        action={formAction}
        style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}
      >
        <input name="message" placeholder="Novo lembrete…" className="crm-select" required />
        <input name="remindAt" type="datetime-local" className="crm-select" required />
        {state.status === "error" && <div className="crm-field-error">{state.message}</div>}
        <button type="submit" className="crm-ag-action-btn">
          Adicionar lembrete
        </button>
      </form>
    </div>
  );
}
