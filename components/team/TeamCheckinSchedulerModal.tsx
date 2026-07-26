"use client";

import { useActionState } from "react";
import {
  createTeamCheckinAction,
  type TeamCheckinActionState,
} from "@/application/team/teamCheckinsActions";
import { useTeamCheckinScheduler } from "@/contexts/team/TeamCheckinSchedulerContext";
import { CHECKIN_TYPE_LABEL } from "@/domain/team/statusMeta";
import type { TeamCheckinType } from "@/types/team";

const INITIAL_STATE: TeamCheckinActionState = { status: "idle" };
const TYPES: TeamCheckinType[] = ["1_1", "reuniao", "avaliacao", "alinhamento"];

export function TeamCheckinSchedulerModal({
  members,
}: {
  members: { id: string; name: string | null }[];
}) {
  const { open, memberId, close } = useTeamCheckinScheduler();

  const [state, formAction] = useActionState(
    async (prev: TeamCheckinActionState, formData: FormData) => {
      const result = await createTeamCheckinAction(prev, formData);
      if (result.status === "success") close();
      return result;
    },
    INITIAL_STATE,
  );

  if (!open) return null;

  return (
    <>
      <button type="button" aria-label="Fechar" className="crm-modal-overlay" onClick={close} />
      <div className="crm-modal-center">
        <div
          className="crm-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Agendar check-in"
          style={{ maxWidth: 480 }}
        >
          <div className="crm-modal-head">
            <span className="crm-modal-title">Agendar check-in</span>
          </div>

          <form action={formAction} className="crm-modal-form">
            <div className="crm-field">
              <label htmlFor="checkin-member">Colaborador *</label>
              <select
                id="checkin-member"
                name="teamMemberId"
                defaultValue={memberId ?? ""}
                required
              >
                <option value="" disabled>
                  Selecione
                </option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name ?? member.id}
                  </option>
                ))}
              </select>
            </div>

            <div className="crm-composer-row">
              <div className="crm-field">
                <label htmlFor="checkin-type">Tipo *</label>
                <select id="checkin-type" name="type" defaultValue="1_1">
                  {TYPES.map((type) => (
                    <option key={type} value={type}>
                      {CHECKIN_TYPE_LABEL[type]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="crm-field">
                <label htmlFor="checkin-scheduled-at">Data e hora *</label>
                <input
                  id="checkin-scheduled-at"
                  name="scheduledAt"
                  type="datetime-local"
                  required
                />
              </div>
            </div>

            <div className="crm-field">
              <label htmlFor="checkin-notes">Observações</label>
              <textarea id="checkin-notes" name="notes" rows={3} />
            </div>

            {state.status === "error" && <div className="crm-field-error">{state.message}</div>}

            <div className="crm-modal-actions">
              <button type="button" className="btn btn-outline" onClick={close}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-accent">
                Agendar
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
