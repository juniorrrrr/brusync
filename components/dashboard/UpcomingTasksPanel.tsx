"use client";

import { useState, useTransition } from "react";
import { toggleTaskDoneAction } from "@/application/crm/leadsActions";
import { useLeadDrawer } from "@/contexts/crm/LeadDrawerContext";
import { formatDateTime } from "@/domain/crm/format";
import type { UpcomingTask } from "@/repositories/crm/activitiesRepository";

export function UpcomingTasksPanel({ tasks }: { tasks: UpcomingTask[] }) {
  const { openLead } = useLeadDrawer();
  const [done, setDone] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();

  function handleToggle(taskId: string) {
    setDone((prev) => new Set(prev).add(taskId));
    startTransition(async () => {
      await toggleTaskDoneAction(taskId, true);
    });
  }

  const visible = tasks.filter((task) => !done.has(task.id));

  return (
    <div className="crm-card crm-card-pad reveal in">
      <div className="crm-card-head">
        <div>
          <div className="crm-card-title">Próximas tarefas</div>
          <div className="crm-card-sub">Pendências registradas nos leads</div>
        </div>
      </div>
      {visible.length === 0 ? (
        <p className="crm-card-sub" style={{ marginTop: 12 }}>
          Nenhuma tarefa pendente.
        </p>
      ) : (
        <div className="crm-mini-list">
          {visible.map((task) => (
            <div key={task.id} className="crm-mini-row">
              <button
                type="button"
                className="crm-task-check"
                aria-label="Concluir tarefa"
                onClick={() => handleToggle(task.id)}
              />
              <button
                type="button"
                style={{ flex: 1, minWidth: 0, textAlign: "left" }}
                onClick={() => openLead(task.crmLeadId)}
              >
                <div className="crm-mini-title">{task.title}</div>
                <div className="crm-mini-meta">{task.leadName}</div>
              </button>
              <span className="crm-mini-trail">
                {task.dueAt ? formatDateTime(task.dueAt) : "Sem prazo"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
