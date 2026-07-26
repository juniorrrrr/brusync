"use client";

import { useActionState } from "react";
import {
  createTeamFeedbackAction,
  type TeamFeedbackActionState,
} from "@/application/team/teamFeedbackActions";
import { useTeamFeedbackComposer } from "@/contexts/team/TeamFeedbackComposerContext";
import { FEEDBACK_TYPE_LABEL } from "@/domain/team/statusMeta";
import type { TeamFeedbackType } from "@/types/team";

const INITIAL_STATE: TeamFeedbackActionState = { status: "idle" };
const TYPES: TeamFeedbackType[] = ["elogio", "construtivo", "alerta", "reconhecimento"];

export function TeamFeedbackComposerModal({
  members,
}: {
  members: { id: string; name: string | null }[];
}) {
  const { open, recipientId, close } = useTeamFeedbackComposer();

  const [state, formAction] = useActionState(
    async (prev: TeamFeedbackActionState, formData: FormData) => {
      const result = await createTeamFeedbackAction(prev, formData);
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
          aria-label="Novo feedback"
          style={{ maxWidth: 480 }}
        >
          <div className="crm-modal-head">
            <span className="crm-modal-title">Novo feedback</span>
          </div>

          <form action={formAction} className="crm-modal-form">
            <div className="crm-field">
              <label htmlFor="feedback-recipient">Destinatário *</label>
              <select
                id="feedback-recipient"
                name="recipientTeamMemberId"
                defaultValue={recipientId ?? ""}
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

            <div className="crm-field">
              <label htmlFor="feedback-type">Tipo *</label>
              <select id="feedback-type" name="type" defaultValue="elogio">
                {TYPES.map((type) => (
                  <option key={type} value={type}>
                    {FEEDBACK_TYPE_LABEL[type]}
                  </option>
                ))}
              </select>
            </div>

            <div className="crm-field">
              <label htmlFor="feedback-comment">Comentário *</label>
              <textarea id="feedback-comment" name="comment" rows={4} required />
            </div>

            {state.status === "error" && <div className="crm-field-error">{state.message}</div>}

            <div className="crm-modal-actions">
              <button type="button" className="btn btn-outline" onClick={close}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-accent">
                Registrar feedback
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
