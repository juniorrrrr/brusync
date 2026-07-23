"use client";

import { useState } from "react";
import {
  deleteWorkflowAction,
  toggleWorkflowStatusAction,
} from "@/application/automation/workflowsActions";
import { WorkflowEditorDialog } from "@/components/automation/WorkflowEditorDialog";
import { Switch } from "@/components/ui/switch";
import {
  AutomationEditorProvider,
  useAutomationEditor,
} from "@/contexts/automation/AutomationEditorContext";
import {
  AUTOMATION_ACTION_LABEL,
  AUTOMATION_CONDITION_LABEL,
  AUTOMATION_PRIORITY_BADGE,
  AUTOMATION_PRIORITY_LABEL,
  AUTOMATION_TRIGGER_LABEL,
} from "@/domain/automation/types";
import { useWorkflowsList } from "@/hooks/automation/useWorkflowsList";
import type { AutomationWorkflow } from "@/types/automation";
import type { PipelineStage } from "@/types/crm";

function WorkflowRow({
  workflow,
  onChanged,
}: {
  workflow: AutomationWorkflow;
  onChanged: () => void;
}) {
  const { openEdit } = useAutomationEditor();
  const [busy, setBusy] = useState(false);

  async function handleToggle(checked: boolean) {
    setBusy(true);
    await toggleWorkflowStatusAction(workflow.id, checked ? "ativo" : "inativo");
    onChanged();
    setBusy(false);
  }

  async function handleDelete() {
    setBusy(true);
    await deleteWorkflowAction(workflow.id);
    onChanged();
    setBusy(false);
  }

  return (
    <div className="crm-au-row">
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <strong>{workflow.name}</strong>
          <span className={`crm-badge ${AUTOMATION_PRIORITY_BADGE[workflow.priority]}`}>
            {AUTOMATION_PRIORITY_LABEL[workflow.priority]}
          </span>
        </div>
        {workflow.description && <p className="crm-au-desc">{workflow.description}</p>}
        <div className="crm-au-flow" style={{ marginTop: 8 }}>
          <span className="crm-au-flow-step">
            {workflow.trigger ? AUTOMATION_TRIGGER_LABEL[workflow.trigger.triggerType] : "—"}
          </span>
          <span className="crm-au-flow-arrow">→</span>
          <span className="crm-au-flow-step">
            {AUTOMATION_CONDITION_LABEL[workflow.conditionType]}
          </span>
          <span className="crm-au-flow-arrow">→</span>
          <span className="crm-au-flow-step">{AUTOMATION_ACTION_LABEL[workflow.actionType]}</span>
        </div>
      </div>

      <div className="crm-au-row-actions">
        <Switch
          defaultChecked={workflow.status === "ativo"}
          disabled={busy}
          onCheckedChange={handleToggle}
        />
        <button
          type="button"
          className="crm-au-action-btn"
          onClick={() => openEdit(workflow.id)}
          disabled={busy}
        >
          Editar
        </button>
        <button
          type="button"
          className="crm-au-action-btn danger"
          onClick={handleDelete}
          disabled={busy}
        >
          Excluir
        </button>
      </div>
    </div>
  );
}

function WorkflowsListInner({ pipelineStages }: { pipelineStages: PipelineStage[] }) {
  const { workflows, loading, reload } = useWorkflowsList();
  const { openCreate } = useAutomationEditor();

  return (
    <div>
      <div className="crm-toolbar" style={{ justifyContent: "flex-end" }}>
        <button type="button" className="btn btn-accent" onClick={openCreate}>
          Nova automação
        </button>
      </div>

      <div className="crm-card crm-card-pad" style={{ marginTop: 12 }}>
        {loading && <p className="crm-card-sub">Carregando…</p>}
        {!loading && workflows.length === 0 && (
          <p className="crm-card-sub">Nenhuma automação criada ainda.</p>
        )}
        {!loading &&
          workflows.map((workflow) => (
            <WorkflowRow key={workflow.id} workflow={workflow} onChanged={reload} />
          ))}
      </div>

      <WorkflowEditorDialog pipelineStages={pipelineStages} onSaved={reload} />
    </div>
  );
}

export function WorkflowsList({ pipelineStages }: { pipelineStages: PipelineStage[] }) {
  return (
    <AutomationEditorProvider>
      <WorkflowsListInner pipelineStages={pipelineStages} />
    </AutomationEditorProvider>
  );
}
