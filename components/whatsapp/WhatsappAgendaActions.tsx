"use client";

import { useState, useTransition } from "react";
import { saveAgendaEventAction } from "@/application/agenda/agendaActions";
import { createReminderAction } from "@/application/agenda/remindersActions";
import { createTaskAction } from "@/application/crm/tasksActions";

type ActionKind = "tarefa" | "lembrete" | "reuniao" | null;

/** Reaproveita 100% das Server Actions já existentes de Projetos/Agenda —
 * nenhuma regra nova de tarefa/lembrete/reunião é criada para o WhatsApp,
 * só um atalho que pré-preenche o lead vinculado à conversa. */
export function WhatsappAgendaActions({ crmLeadId }: { crmLeadId: string | null }) {
  const [open, setOpen] = useState<ActionKind>(null);
  const [text, setText] = useState("");
  const [when, setWhen] = useState("");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  if (!crmLeadId) {
    return (
      <p className="crm-card-sub">Vincule um lead para criar tarefas, lembretes ou reuniões.</p>
    );
  }

  function submit() {
    if (!text.trim()) return;
    startTransition(async () => {
      if (open === "tarefa") {
        const result = await createTaskAction({ crmLeadId: crmLeadId as string, title: text });
        setMessage(result.ok ? "Tarefa criada." : (result.error ?? "Falha ao criar tarefa."));
      } else if (open === "lembrete") {
        const formData = new FormData();
        formData.append("message", text);
        formData.append("remindAt", when || new Date().toISOString());
        formData.append("crmLeadId", crmLeadId as string);
        const result = await createReminderAction({ status: "idle" }, formData);
        setMessage(result.message ?? null);
      } else if (open === "reuniao") {
        const formData = new FormData();
        formData.append("title", text);
        formData.append("eventType", "reuniao");
        formData.append("scheduledAt", when || new Date().toISOString());
        formData.append("crmLeadId", crmLeadId as string);
        const result = await saveAgendaEventAction({ status: "idle" }, formData);
        setMessage(result.message ?? null);
      }
      setText("");
      setOpen(null);
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <button type="button" className="btn btn-outline" onClick={() => setOpen("tarefa")}>
          Criar tarefa
        </button>
        <button type="button" className="btn btn-outline" onClick={() => setOpen("lembrete")}>
          Criar lembrete
        </button>
        <button type="button" className="btn btn-outline" onClick={() => setOpen("reuniao")}>
          Agendar reunião
        </button>
      </div>

      {open && (
        <div
          className="crm-composer-row"
          style={{ flexDirection: "column", alignItems: "stretch" }}
        >
          <input
            placeholder={
              open === "tarefa"
                ? "Título da tarefa"
                : open === "lembrete"
                  ? "Texto do lembrete"
                  : "Título da reunião"
            }
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          {open !== "tarefa" && (
            <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
          )}
          <div style={{ display: "flex", gap: 6 }}>
            <button type="button" className="btn btn-accent" disabled={isPending} onClick={submit}>
              Salvar
            </button>
            <button type="button" className="btn btn-outline" onClick={() => setOpen(null)}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {message && <p className="crm-card-sub">{message}</p>}
    </div>
  );
}
