"use client";

import { useActionState } from "react";
import {
  createTeamGoalAction,
  type TeamGoalActionState,
  updateTeamGoalAction,
} from "@/application/team/teamGoalsActions";
import { useTeamGoalEditor } from "@/contexts/team/TeamGoalEditorContext";
import {
  TEAM_GOAL_PERIOD_LABEL,
  TEAM_GOAL_PERIOD_TYPES,
  TEAM_GOAL_TYPE_META,
  TEAM_GOAL_TYPES,
} from "@/domain/team/goalTypes";

const INITIAL_STATE: TeamGoalActionState = { status: "idle" };

export function TeamGoalEditorModal({
  members,
}: {
  members: { id: string; name: string | null }[];
}) {
  const { mode, editingGoal, close } = useTeamGoalEditor();
  const open = mode !== "closed";

  const [state, formAction] = useActionState(
    async (prev: TeamGoalActionState, formData: FormData) => {
      const result =
        mode === "edit"
          ? await updateTeamGoalAction(prev, formData)
          : await createTeamGoalAction(prev, formData);
      if (result.status === "success") close();
      return result;
    },
    INITIAL_STATE,
  );

  if (!open) return null;

  const meta = editingGoal ? TEAM_GOAL_TYPE_META[editingGoal.type] : null;

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
              {mode === "create" ? "Nova meta de colaborador" : "Editar meta"}
            </span>
          </div>

          <form action={formAction} className="crm-modal-form">
            {editingGoal && <input type="hidden" name="id" value={editingGoal.id} />}

            {mode === "create" && (
              <>
                <div className="crm-field">
                  <label htmlFor="team-goal-member">Colaborador *</label>
                  <select id="team-goal-member" name="teamMemberId" required>
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name ?? member.id}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="crm-composer-row">
                  <div className="crm-field">
                    <label htmlFor="team-goal-type">Indicador *</label>
                    <select id="team-goal-type" name="type" defaultValue={TEAM_GOAL_TYPES[0]}>
                      {TEAM_GOAL_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {TEAM_GOAL_TYPE_META[type].label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="crm-field">
                    <label htmlFor="team-goal-period-type">Período *</label>
                    <select id="team-goal-period-type" name="periodType" defaultValue="mensal">
                      {TEAM_GOAL_PERIOD_TYPES.map((period) => (
                        <option key={period} value={period}>
                          {TEAM_GOAL_PERIOD_LABEL[period]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}

            <div className="crm-composer-row">
              <div className="crm-field">
                <label htmlFor="team-goal-period-start">Início *</label>
                <input
                  id="team-goal-period-start"
                  name="periodStart"
                  type="date"
                  required
                  defaultValue={editingGoal?.periodStart.slice(0, 10) ?? ""}
                />
              </div>
              <div className="crm-field">
                <label htmlFor="team-goal-period-end">Fim *</label>
                <input
                  id="team-goal-period-end"
                  name="periodEnd"
                  type="date"
                  required
                  defaultValue={editingGoal?.periodEnd.slice(0, 10) ?? ""}
                />
              </div>
            </div>

            <div className="crm-field">
              <label htmlFor="team-goal-target">Valor-alvo * {meta ? `(${meta.unit})` : ""}</label>
              <input
                id="team-goal-target"
                name="targetValue"
                type="number"
                step="0.01"
                min="0.01"
                required
                defaultValue={editingGoal?.targetValue ?? ""}
              />
            </div>

            <div className="crm-field">
              <label htmlFor="team-goal-notes">Notas</label>
              <textarea
                id="team-goal-notes"
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
