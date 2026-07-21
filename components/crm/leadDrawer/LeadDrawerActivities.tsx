"use client";

import { useActionState, useState, useTransition } from "react";
import {
  type ActionState,
  addActivityAction,
  toggleTaskDoneAction,
} from "@/application/crm/leadsActions";
import { ACTIVITY_TYPE_LABEL } from "@/domain/crm/activityRules";
import { formatDateTime, formatRelativeToNow } from "@/domain/crm/format";
import type { ActivityType, LeadActivity } from "@/types/crm";

const INITIAL_STATE: ActionState = { status: "idle" };
const TYPE_OPTIONS: ActivityType[] = ["note", "call", "email", "meeting", "task"];

export function LeadDrawerActivities({
  crmLeadId,
  activities,
  onChanged,
}: {
  crmLeadId: string;
  activities: LeadActivity[];
  onChanged: () => void;
}) {
  const [type, setType] = useState<ActivityType>("note");
  const [isPending, startTransition] = useTransition();
  const [state, formAction, pending] = useActionState(async (prev: ActionState, fd: FormData) => {
    const result = await addActivityAction(prev, fd);
    if (result.status === "success") onChanged();
    return result;
  }, INITIAL_STATE);

  function handleToggle(activityId: string, done: boolean) {
    startTransition(async () => {
      await toggleTaskDoneAction(activityId, done);
      onChanged();
    });
  }

  return (
    <div className="crm-drawer-section" style={{ marginTop: 0, paddingTop: 0, borderTop: "none" }}>
      <form action={formAction} className="crm-composer">
        <input type="hidden" name="crmLeadId" value={crmLeadId} />
        <div className="crm-composer-row">
          <select
            name="type"
            className="crm-select"
            value={type}
            onChange={(e) => setType(e.target.value as ActivityType)}
          >
            {TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {ACTIVITY_TYPE_LABEL[t]}
              </option>
            ))}
          </select>
          {type === "task" && <input name="dueAt" type="datetime-local" className="crm-select" />}
        </div>
        <input name="title" placeholder="Título" required />
        <textarea name="body" placeholder="Detalhes (opcional)" />
        {state.status === "error" && <div className="crm-field-error">{state.message}</div>}
        <div className="crm-composer-actions">
          <span className="crm-card-sub" style={{ margin: 0 }}>
            {activities.length} registro{activities.length === 1 ? "" : "s"}
          </span>
          <button type="submit" className="btn btn-accent" disabled={pending}>
            {pending ? "Salvando…" : "Registrar"}
          </button>
        </div>
      </form>

      {activities.length === 0 ? (
        <p className="crm-card-sub">Nenhuma atividade registrada ainda.</p>
      ) : (
        <div className="crm-timeline">
          {activities.map((activity) => (
            <div key={activity.id} className="crm-timeline-item">
              {activity.type === "task" ? (
                <button
                  type="button"
                  className={`crm-task-check${activity.done ? " done" : ""}`}
                  disabled={isPending}
                  onClick={() => handleToggle(activity.id, !activity.done)}
                  aria-label={activity.done ? "Marcar como pendente" : "Marcar como concluída"}
                >
                  {activity.done && "✓"}
                </button>
              ) : (
                <span className="crm-timeline-dot" />
              )}
              <div>
                <div className={`crm-timeline-title${activity.done ? " done" : ""}`}>
                  {activity.title}
                </div>
                {activity.body && <div className="crm-timeline-meta">{activity.body}</div>}
                <div className="crm-timeline-meta">
                  {ACTIVITY_TYPE_LABEL[activity.type]} · {activity.createdByName ?? "Sistema"} ·{" "}
                  {formatRelativeToNow(activity.createdAt)}
                  {activity.dueAt && ` · prazo ${formatDateTime(activity.dueAt)}`}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
