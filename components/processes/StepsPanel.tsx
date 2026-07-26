"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  addChecklistItemAction,
  addProcessStepAction,
  removeProcessStepAction,
  updateProcessStepStatusAction,
} from "@/application/processes/processesActions";
import { ChecklistItemRow } from "@/components/processes/ChecklistItemRow";
import { IconPlus, IconTrash } from "@/components/ui/icons";
import {
  PROCESS_STEP_STATUS_BADGE,
  PROCESS_STEP_STATUS_LABEL,
} from "@/domain/processes/statusMeta";
import type { ProcessChecklistItem, ProcessStep } from "@/types/processes";

function StepRow({ step, processId }: { step: ProcessStep; processId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [newItem, setNewItem] = useState("");

  function setStatus(status: "em_andamento" | "concluido") {
    startTransition(async () => {
      await updateProcessStepStatusAction(step.id, processId, status);
      router.refresh();
    });
  }

  function handleRemove() {
    if (!confirm(`Remover a etapa "${step.name}"?`)) return;
    startTransition(async () => {
      await removeProcessStepAction(step.id, processId);
      router.refresh();
    });
  }

  function handleAddItem() {
    if (!newItem.trim()) return;
    startTransition(async () => {
      await addChecklistItemAction(processId, step.id, newItem, step.checklistItems.length);
      setNewItem("");
      router.refresh();
    });
  }

  return (
    <div className="crm-proc-step">
      <div className="crm-int-card-top">
        <div>
          <div className="crm-int-card-title">{step.name}</div>
          {step.description && <div className="crm-int-card-desc">{step.description}</div>}
        </div>
        <span className={`crm-badge ${PROCESS_STEP_STATUS_BADGE[step.status]}`}>
          {PROCESS_STEP_STATUS_LABEL[step.status]}
        </span>
      </div>

      <div className="crm-proc-progress-bar">
        <div className="crm-proc-progress-fill" style={{ width: `${step.progressPercent}%` }} />
      </div>

      <div className="crm-proc-checklist-list">
        {step.checklistItems.map((item) => (
          <ChecklistItemRow key={item.id} item={item} processId={processId} />
        ))}
      </div>

      <div className="crm-composer-row" style={{ marginTop: 8 }}>
        <input
          placeholder="Novo item de checklist"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
        />
        <button
          type="button"
          className="btn btn-outline"
          onClick={handleAddItem}
          disabled={isPending}
        >
          <IconPlus size={13} />
        </button>
      </div>

      <div className="crm-int-card-actions">
        {step.status === "pendente" && (
          <button
            type="button"
            className="btn btn-outline"
            disabled={isPending}
            onClick={() => setStatus("em_andamento")}
          >
            Iniciar etapa
          </button>
        )}
        {step.status !== "concluido" && (
          <button
            type="button"
            className="btn btn-outline"
            disabled={isPending}
            onClick={() => setStatus("concluido")}
          >
            Concluir etapa
          </button>
        )}
        <button
          type="button"
          className="btn btn-outline"
          disabled={isPending}
          onClick={handleRemove}
        >
          <IconTrash size={13} /> Remover
        </button>
      </div>
    </div>
  );
}

function StandaloneChecklist({
  processId,
  items,
}: {
  processId: string;
  items: ProcessChecklistItem[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [newItem, setNewItem] = useState("");

  function handleAdd() {
    if (!newItem.trim()) return;
    startTransition(async () => {
      await addChecklistItemAction(processId, null, newItem, items.length);
      setNewItem("");
      router.refresh();
    });
  }

  return (
    <div className="crm-card crm-card-pad">
      <div className="crm-card-title">Checklist geral</div>
      <div className="crm-proc-checklist-list" style={{ marginTop: 8 }}>
        {items.map((item) => (
          <ChecklistItemRow key={item.id} item={item} processId={processId} />
        ))}
        {items.length === 0 && (
          <p className="crm-card-sub">Nenhum item avulso — adicione um abaixo ou use etapas.</p>
        )}
      </div>
      <div className="crm-composer-row" style={{ marginTop: 8 }}>
        <input
          placeholder="Novo item de checklist"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
        />
        <button type="button" className="btn btn-outline" onClick={handleAdd} disabled={isPending}>
          <IconPlus size={13} />
        </button>
      </div>
    </div>
  );
}

export function StepsPanel({
  processId,
  steps,
  standaloneChecklist,
}: {
  processId: string;
  steps: ProcessStep[];
  standaloneChecklist: ProcessChecklistItem[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [newStep, setNewStep] = useState("");

  function handleAddStep() {
    if (!newStep.trim()) return;
    startTransition(async () => {
      await addProcessStepAction(processId, newStep, steps.length);
      setNewStep("");
      router.refresh();
    });
  }

  return (
    <div className="crm-card crm-card-pad">
      <div className="crm-card-title">Etapas</div>
      <div className="crm-proc-steps-list" style={{ marginTop: 8 }}>
        {steps.map((step) => (
          <StepRow key={step.id} step={step} processId={processId} />
        ))}
        {steps.length === 0 && (
          <p className="crm-card-sub">
            Nenhuma etapa — use o checklist geral abaixo ou adicione uma etapa.
          </p>
        )}
      </div>
      <div className="crm-composer-row" style={{ marginTop: 12 }}>
        <input
          placeholder="Nome da nova etapa"
          value={newStep}
          onChange={(e) => setNewStep(e.target.value)}
        />
        <button
          type="button"
          className="btn btn-outline"
          onClick={handleAddStep}
          disabled={isPending}
        >
          <IconPlus size={13} /> Adicionar etapa
        </button>
      </div>

      <div style={{ marginTop: 16 }}>
        <StandaloneChecklist processId={processId} items={standaloneChecklist} />
      </div>
    </div>
  );
}
