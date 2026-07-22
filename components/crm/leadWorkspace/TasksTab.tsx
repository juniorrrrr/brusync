"use client";

import { useEffect, useState } from "react";
import { fetchOwnerOptions } from "@/application/crm/leadsActions";
import {
  createTaskAction,
  deleteTaskAction,
  fetchTasks,
  updateTaskAction,
  updateTaskStatusAction,
} from "@/application/crm/tasksActions";
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { IconPencil, IconTrash } from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime, initials } from "@/domain/crm/format";
import { isTaskOverdue, TASK_PRIORITY_BADGE, TASK_PRIORITY_LABEL } from "@/domain/crm/taskRules";
import type { LeadTask, TaskPriority } from "@/types/crm";

const PRIORITIES: TaskPriority[] = ["low", "medium", "high"];

function TaskRow({
  task,
  owners,
  onChanged,
  onDeleted,
}: {
  task: LeadTask;
  owners: { id: string; name: string | null; email: string | null }[];
  onChanged: (task: LeadTask) => void;
  onDeleted: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [dueAt, setDueAt] = useState(task.dueAt ? task.dueAt.slice(0, 16) : "");
  const [assigneeId, setAssigneeId] = useState(task.assigneeId ?? "");
  const [busy, setBusy] = useState(false);

  async function toggleDone() {
    setBusy(true);
    const nextStatus = task.status === "done" ? "pending" : "done";
    await updateTaskStatusAction(task.id, nextStatus);
    onChanged({ ...task, status: nextStatus });
    setBusy(false);
  }

  async function handleSave() {
    setBusy(true);
    await updateTaskAction({
      taskId: task.id,
      title,
      priority,
      dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
      assigneeId: assigneeId || undefined,
    });
    onChanged({
      ...task,
      title,
      priority,
      dueAt: dueAt ? new Date(dueAt).toISOString() : null,
      assigneeId: assigneeId || null,
    });
    setBusy(false);
    setEditing(false);
  }

  async function handleDelete() {
    if (!window.confirm("Excluir esta tarefa?")) return;
    await deleteTaskAction(task.id);
    onDeleted(task.id);
  }

  const overdue = isTaskOverdue(task);

  if (editing) {
    return (
      <div className="crm-task-row">
        <div className="crm-task-body">
          <div className="crm-ws-composer-row">
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
            <select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {TASK_PRIORITY_LABEL[p]}
                </option>
              ))}
            </select>
          </div>
          <div className="crm-ws-composer-row">
            <input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
            <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
              <option value="">Sem responsável</option>
              {owners.map((owner) => (
                <option key={owner.id} value={owner.id}>
                  {owner.name || owner.email}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button type="button" className="btn btn-accent" disabled={busy} onClick={handleSave}>
              Salvar
            </button>
            <button type="button" className="btn btn-outline" onClick={() => setEditing(false)}>
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`crm-task-row${task.status === "done" ? " done" : ""}`}>
      <button
        type="button"
        className={`crm-task-check${task.status === "done" ? " done" : ""}`}
        disabled={busy}
        onClick={toggleDone}
        aria-label={task.status === "done" ? "Marcar como pendente" : "Concluir tarefa"}
      >
        {task.status === "done" && "✓"}
      </button>
      <div className="crm-task-body">
        <div className="crm-task-title">{task.title}</div>
        {task.description && <div className="crm-task-desc">{task.description}</div>}
        <div className="crm-task-tags">
          <span className={`crm-badge ${TASK_PRIORITY_BADGE[task.priority]}`}>
            {TASK_PRIORITY_LABEL[task.priority]}
          </span>
          {task.dueAt && (
            <span className={`crm-badge ${overdue ? "danger" : "neutral"}`}>
              {formatDateTime(task.dueAt)}
            </span>
          )}
          {task.assignee && (
            <span className="crm-avatar" style={{ width: 20, height: 20, fontSize: 9 }}>
              {initials(task.assignee.name || task.assignee.email)}
            </span>
          )}
        </div>
      </div>
      <div className="crm-task-actions">
        <button
          type="button"
          className="crm-icon-btn"
          onClick={() => setEditing(true)}
          aria-label="Editar tarefa"
        >
          <IconPencil size={14} />
        </button>
        <button
          type="button"
          className="crm-icon-btn"
          onClick={handleDelete}
          aria-label="Excluir tarefa"
        >
          <IconTrash size={14} />
        </button>
      </div>
    </div>
  );
}

export function TasksTab({ crmLeadId }: { crmLeadId: string }) {
  const [tasks, setTasks] = useState<LeadTask[]>([]);
  const [owners, setOwners] = useState<{ id: string; name: string | null; email: string | null }[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [dueAt, setDueAt] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchTasks(crmLeadId), fetchOwnerOptions()]).then(([taskData, ownerData]) => {
      if (cancelled) return;
      setTasks(taskData);
      setOwners(ownerData);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [crmLeadId]);

  async function handleAdd() {
    if (!title.trim()) return;
    setSubmitting(true);
    const result = await createTaskAction({
      crmLeadId,
      title,
      priority,
      dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
      assigneeId: assigneeId || undefined,
    });
    setSubmitting(false);
    if (result.ok && result.task) {
      setTasks((prev) => [result.task as LeadTask, ...prev]);
      setTitle("");
      setDueAt("");
      setAssigneeId("");
    }
  }

  function handleChanged(updated: LeadTask) {
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  }

  function handleDeleted(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  if (loading) {
    return (
      <div>
        <Skeleton style={{ height: 90, marginBottom: 16 }} />
        <Skeleton style={{ height: 50, marginBottom: 8 }} />
        <Skeleton style={{ height: 50 }} />
      </div>
    );
  }

  return (
    <div>
      <div className="crm-ws-composer">
        <input
          placeholder="Título da tarefa"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div className="crm-ws-composer-row">
          <select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {TASK_PRIORITY_LABEL[p]}
              </option>
            ))}
          </select>
          <input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
          <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
            <option value="">Sem responsável</option>
            {owners.map((owner) => (
              <option key={owner.id} value={owner.id}>
                {owner.name || owner.email}
              </option>
            ))}
          </select>
        </div>
        <div className="crm-composer-actions">
          <span className="crm-card-sub" style={{ margin: 0 }}>
            {tasks.length} tarefa{tasks.length === 1 ? "" : "s"}
          </span>
          <button
            type="button"
            className="btn btn-accent"
            disabled={submitting || !title.trim()}
            onClick={handleAdd}
          >
            {submitting ? "Adicionando…" : "Adicionar tarefa"}
          </button>
        </div>
      </div>

      {tasks.length === 0 ? (
        <Empty>
          <EmptyMedia variant="icon">✅</EmptyMedia>
          <EmptyTitle>Nenhuma tarefa ainda</EmptyTitle>
          <EmptyDescription>Crie a primeira tarefa para este lead acima.</EmptyDescription>
        </Empty>
      ) : (
        tasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            owners={owners}
            onChanged={handleChanged}
            onDeleted={handleDeleted}
          />
        ))
      )}
    </div>
  );
}
