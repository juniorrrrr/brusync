"use client";

import { useActionState, useEffect, useState } from "react";
import {
  saveWorkflowAction,
  type WorkflowActionState,
} from "@/application/automation/workflowsActions";
import { Switch } from "@/components/ui/switch";
import { useAutomationEditor } from "@/contexts/automation/AutomationEditorContext";
import {
  AUTOMATION_ACTION_LABEL,
  AUTOMATION_ACTION_TYPES,
  AUTOMATION_CONDITION_LABEL,
  AUTOMATION_CONDITION_TYPES,
  AUTOMATION_PRIORITY_LABEL,
  AUTOMATION_TRIGGER_LABEL,
  AUTOMATION_TRIGGER_TYPES,
} from "@/domain/automation/types";
import type {
  AutomationActionType,
  AutomationConditionType,
  AutomationPriority,
  AutomationTriggerType,
} from "@/types/automation";
import type { PipelineStage } from "@/types/crm";

const INITIAL_STATE: WorkflowActionState = { status: "idle" };

export function WorkflowEditorDialog({
  pipelineStages,
  onSaved,
}: {
  pipelineStages: PipelineStage[];
  onSaved: () => void;
}) {
  const { mode, workflow, loading, error, close } = useAutomationEditor();
  const open = mode !== "closed";

  const [triggerType, setTriggerType] = useState<AutomationTriggerType>("lead_created");
  const [conditionType, setConditionType] = useState<AutomationConditionType>("sempre");
  const [actionType, setActionType] = useState<AutomationActionType>("criar_alerta");

  const [state, formAction] = useActionState(async (prev: WorkflowActionState, fd: FormData) => {
    const result = await saveWorkflowAction(prev, fd);
    if (result.status === "success") {
      onSaved();
      close();
    }
    return result;
  }, INITIAL_STATE);

  useEffect(() => {
    if (mode === "create") {
      setTriggerType("lead_created");
      setConditionType("sempre");
      setActionType("criar_alerta");
    } else if (workflow) {
      setTriggerType(workflow.trigger?.triggerType ?? "lead_created");
      setConditionType(workflow.conditionType);
      setActionType(workflow.actionType);
    }
  }, [mode, workflow]);

  if (!open) return null;

  return (
    <>
      <button type="button" aria-label="Fechar" className="crm-modal-overlay" onClick={close} />
      <div className="crm-modal-center">
        <div
          className="crm-modal"
          role="dialog"
          aria-modal="true"
          aria-label={mode === "create" ? "Nova automação" : "Editar automação"}
          style={{ maxWidth: 560 }}
        >
          <div className="crm-modal-head">
            <span className="crm-modal-title">
              {mode === "create" ? "Nova automação" : "Editar automação"}
            </span>
          </div>

          {loading && <div className="crm-drawer-loading">Carregando…</div>}
          {!loading && error && <div className="crm-drawer-empty">{error}</div>}

          {!loading && !error && (
            <form action={formAction} className="crm-modal-form">
              {workflow && <input type="hidden" name="id" value={workflow.id} />}

              <div className="crm-field">
                <label htmlFor="au-name">Nome *</label>
                <input id="au-name" name="name" required defaultValue={workflow?.name ?? ""} />
              </div>

              <div className="crm-field">
                <label htmlFor="au-description">Descrição</label>
                <textarea
                  id="au-description"
                  name="description"
                  rows={2}
                  defaultValue={workflow?.description ?? ""}
                />
              </div>

              <div className="crm-composer-row">
                <div className="crm-field">
                  <label htmlFor="au-priority">Prioridade</label>
                  <select
                    id="au-priority"
                    name="priority"
                    defaultValue={workflow?.priority ?? ("media" satisfies AutomationPriority)}
                  >
                    {(["baixa", "media", "alta"] as AutomationPriority[]).map((value) => (
                      <option key={value} value={value}>
                        {AUTOMATION_PRIORITY_LABEL[value]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="crm-field">
                  <label htmlFor="au-status-toggle">Status</label>
                  <label
                    htmlFor="au-status-toggle"
                    style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}
                  >
                    <Switch
                      id="au-status-toggle"
                      name="status"
                      defaultChecked={(workflow?.status ?? "ativo") === "ativo"}
                    />
                    <span className="crm-card-sub" style={{ margin: 0 }}>
                      Ativa
                    </span>
                  </label>
                </div>
              </div>

              <div className="crm-field">
                <label htmlFor="au-trigger">Trigger — SE</label>
                <select
                  id="au-trigger"
                  name="triggerType"
                  value={triggerType}
                  onChange={(e) => setTriggerType(e.target.value as AutomationTriggerType)}
                >
                  {AUTOMATION_TRIGGER_TYPES.map((value) => (
                    <option key={value} value={value}>
                      {AUTOMATION_TRIGGER_LABEL[value]}
                    </option>
                  ))}
                </select>
              </div>

              {triggerType === "lead_stalled" && (
                <div className="crm-field">
                  <label htmlFor="au-trigger-days">Dias sem interação</label>
                  <input
                    id="au-trigger-days"
                    name="triggerDays"
                    type="number"
                    min={1}
                    defaultValue={
                      (workflow?.trigger?.triggerConfig.days as number | undefined) ?? 3
                    }
                  />
                </div>
              )}

              <div className="crm-field">
                <label htmlFor="au-condition">Condição</label>
                <select
                  id="au-condition"
                  name="conditionType"
                  value={conditionType}
                  onChange={(e) => setConditionType(e.target.value as AutomationConditionType)}
                >
                  {AUTOMATION_CONDITION_TYPES.map((value) => (
                    <option key={value} value={value}>
                      {AUTOMATION_CONDITION_LABEL[value]}
                    </option>
                  ))}
                </select>
              </div>

              {conditionType === "origem_igual" && (
                <div className="crm-field">
                  <label htmlFor="au-condition-origin">Origem</label>
                  <input
                    id="au-condition-origin"
                    name="conditionOrigin"
                    placeholder="Site, Indicação, Meta Ads…"
                    defaultValue={(workflow?.conditionConfig.origin as string | undefined) ?? ""}
                  />
                </div>
              )}
              {conditionType === "score_maior_igual" && (
                <div className="crm-field">
                  <label htmlFor="au-condition-score">Score mínimo</label>
                  <input
                    id="au-condition-score"
                    name="conditionScore"
                    type="number"
                    min={0}
                    max={100}
                    defaultValue={(workflow?.conditionConfig.score as number | undefined) ?? 0}
                  />
                </div>
              )}
              {conditionType === "dias_parado_maior_igual" && (
                <div className="crm-field">
                  <label htmlFor="au-condition-days">Dias mínimos parado</label>
                  <input
                    id="au-condition-days"
                    name="conditionDays"
                    type="number"
                    min={1}
                    defaultValue={(workflow?.conditionConfig.days as number | undefined) ?? 3}
                  />
                </div>
              )}
              {conditionType === "estagio_igual" && (
                <div className="crm-field">
                  <label htmlFor="au-condition-stage">Estágio</label>
                  <select
                    id="au-condition-stage"
                    name="conditionStageKey"
                    defaultValue={(workflow?.conditionConfig.stageKey as string | undefined) ?? ""}
                  >
                    <option value="">Selecione…</option>
                    {pipelineStages.map((stage) => (
                      <option key={stage.id} value={stage.key}>
                        {stage.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="crm-field">
                <label htmlFor="au-action">Ação</label>
                <select
                  id="au-action"
                  name="actionType"
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value as AutomationActionType)}
                >
                  {AUTOMATION_ACTION_TYPES.map((value) => (
                    <option key={value} value={value}>
                      {AUTOMATION_ACTION_LABEL[value]}
                    </option>
                  ))}
                </select>
              </div>

              {actionType === "mover_pipeline" && (
                <div className="crm-field">
                  <label htmlFor="au-action-stage">Estágio de destino</label>
                  <select
                    id="au-action-stage"
                    name="actionStageKey"
                    defaultValue={(workflow?.actionConfig.stageKey as string | undefined) ?? ""}
                  >
                    <option value="">Selecione…</option>
                    {pipelineStages.map((stage) => (
                      <option key={stage.id} value={stage.key}>
                        {stage.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {actionType === "criar_tarefa" && (
                <>
                  <div className="crm-field">
                    <label htmlFor="au-action-title">Título da tarefa</label>
                    <input
                      id="au-action-title"
                      name="actionTitle"
                      defaultValue={(workflow?.actionConfig.title as string | undefined) ?? ""}
                    />
                  </div>
                  <div className="crm-field">
                    <label htmlFor="au-action-priority">Prioridade da tarefa</label>
                    <select
                      id="au-action-priority"
                      name="actionPriority"
                      defaultValue={
                        (workflow?.actionConfig.priority as string | undefined) ?? "medium"
                      }
                    >
                      <option value="low">Baixa</option>
                      <option value="medium">Média</option>
                      <option value="high">Alta</option>
                    </select>
                  </div>
                </>
              )}
              {actionType === "criar_alerta" && (
                <div className="crm-field">
                  <label htmlFor="au-action-message">Mensagem do alerta</label>
                  <textarea
                    id="au-action-message"
                    name="actionMessage"
                    rows={2}
                    defaultValue={(workflow?.actionConfig.message as string | undefined) ?? ""}
                  />
                </div>
              )}

              {state.status === "error" && <div className="crm-field-error">{state.message}</div>}

              <div className="crm-modal-actions">
                <button type="button" className="btn btn-outline" onClick={close}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-accent">
                  {mode === "create" ? "Criar automação" : "Salvar alterações"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
