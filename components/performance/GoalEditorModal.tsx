"use client";

import { useActionState, useState } from "react";
import {
  createGoalAction,
  type GoalActionState,
  updateGoalAction,
} from "@/application/performance/performanceGoalsActions";
import { useGoalEditor } from "@/contexts/performance/GoalEditorContext";
import {
  GOAL_PERIOD_LABEL,
  GOAL_PERIOD_TYPES,
  GOAL_SCOPE_LABEL,
  GOAL_TYPE_META,
  GOAL_TYPES,
} from "@/domain/performance/goalTypes";
import type { GoalScopeOption, GoalScopeType, GoalType } from "@/types/performance";

const INITIAL_STATE: GoalActionState = { status: "idle" };

export function GoalEditorModal({
  scopeOptions,
}: {
  scopeOptions: Record<GoalScopeType, GoalScopeOption[]>;
}) {
  const { mode, editingGoal, close } = useGoalEditor();
  const open = mode !== "closed";

  const [selectedType, setSelectedType] = useState<GoalType>(editingGoal?.type ?? GOAL_TYPES[0]);
  const [selectedScopeType, setSelectedScopeType] = useState<GoalScopeType>(
    editingGoal?.scopeType ?? GOAL_TYPE_META[GOAL_TYPES[0]].validScopes[0],
  );

  const [state, formAction] = useActionState(async (prev: GoalActionState, formData: FormData) => {
    const result =
      mode === "edit"
        ? await updateGoalAction(prev, formData)
        : await createGoalAction(prev, formData);
    if (result.status === "success") close();
    return result;
  }, INITIAL_STATE);

  if (!open) return null;

  const meta = GOAL_TYPE_META[selectedType];
  const currentOptions = scopeOptions[selectedScopeType] ?? [];

  return (
    <>
      <button type="button" aria-label="Fechar" className="crm-modal-overlay" onClick={close} />
      <div className="crm-modal-center">
        <div
          className="crm-modal"
          role="dialog"
          aria-modal="true"
          aria-label={mode === "create" ? "Nova meta" : "Editar meta"}
          style={{ maxWidth: 520 }}
        >
          <div className="crm-modal-head">
            <span className="crm-modal-title">
              {mode === "create" ? "Nova meta" : "Editar meta"}
            </span>
          </div>

          <form action={formAction} className="crm-modal-form">
            {editingGoal && <input type="hidden" name="id" value={editingGoal.id} />}

            {mode === "create" && (
              <>
                <div className="crm-field">
                  <label htmlFor="goal-type">Tipo de meta *</label>
                  <select
                    id="goal-type"
                    name="type"
                    value={selectedType}
                    onChange={(event) => {
                      const next = event.target.value as GoalType;
                      setSelectedType(next);
                      if (!GOAL_TYPE_META[next].validScopes.includes(selectedScopeType)) {
                        setSelectedScopeType(GOAL_TYPE_META[next].validScopes[0]);
                      }
                    }}
                  >
                    {GOAL_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {GOAL_TYPE_META[type].label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="crm-composer-row">
                  <div className="crm-field">
                    <label htmlFor="goal-scope-type">Escopo *</label>
                    <select
                      id="goal-scope-type"
                      name="scopeType"
                      value={selectedScopeType}
                      onChange={(event) =>
                        setSelectedScopeType(event.target.value as GoalScopeType)
                      }
                    >
                      {meta.validScopes.map((scope) => (
                        <option key={scope} value={scope}>
                          {GOAL_SCOPE_LABEL[scope]}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedScopeType !== "empresa" && (
                    <div className="crm-field">
                      <label htmlFor="goal-scope-ref">{GOAL_SCOPE_LABEL[selectedScopeType]}</label>
                      {currentOptions.length > 0 ? (
                        <select id="goal-scope-ref" name="scopeRef" required>
                          {currentOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          id="goal-scope-ref"
                          name="scopeRef"
                          required
                          placeholder="Digite o valor"
                        />
                      )}
                    </div>
                  )}
                </div>

                <div className="crm-field">
                  <label htmlFor="goal-period-type">Período *</label>
                  <select id="goal-period-type" name="periodType" defaultValue="mensal">
                    {GOAL_PERIOD_TYPES.map((period) => (
                      <option key={period} value={period}>
                        {GOAL_PERIOD_LABEL[period]}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div className="crm-composer-row">
              <div className="crm-field">
                <label htmlFor="goal-period-start">Início *</label>
                <input
                  id="goal-period-start"
                  name="periodStart"
                  type="date"
                  required
                  defaultValue={editingGoal?.periodStart.slice(0, 10) ?? ""}
                />
              </div>
              <div className="crm-field">
                <label htmlFor="goal-period-end">Fim *</label>
                <input
                  id="goal-period-end"
                  name="periodEnd"
                  type="date"
                  required
                  defaultValue={editingGoal?.periodEnd.slice(0, 10) ?? ""}
                />
              </div>
            </div>

            <div className="crm-field">
              <label htmlFor="goal-target">Valor-alvo * ({meta.unit})</label>
              <input
                id="goal-target"
                name="targetValue"
                type="number"
                step="0.01"
                min="0.01"
                required
                defaultValue={editingGoal?.targetValue ?? ""}
              />
            </div>

            <div className="crm-field">
              <label htmlFor="goal-notes">Notas</label>
              <textarea
                id="goal-notes"
                name="notes"
                rows={2}
                defaultValue={editingGoal?.notes ?? ""}
              />
            </div>

            {state.status === "error" && <div className="crm-field-error">{state.message}</div>}

            <div className="crm-modal-actions">
              <button type="button" className="btn btn-outline" onClick={close}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-accent">
                {mode === "create" ? "Criar meta" : "Salvar alterações"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
