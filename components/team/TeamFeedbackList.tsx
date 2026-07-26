"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { updateTeamFeedbackStatusAction } from "@/application/team/teamFeedbackActions";
import { FEEDBACK_TYPE_BADGE, FEEDBACK_TYPE_LABEL } from "@/domain/team/statusMeta";
import type { TeamFeedback } from "@/types/team";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR");
}

export function TeamFeedbackList({
  feedbacks,
  showRecipient = false,
}: {
  feedbacks: TeamFeedback[];
  showRecipient?: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function archive(id: string) {
    startTransition(async () => {
      await updateTeamFeedbackStatusAction(id, "arquivado");
      router.refresh();
    });
  }

  if (feedbacks.length === 0) {
    return <p className="crm-card-sub">Nenhum feedback registrado ainda.</p>;
  }

  return (
    <div className="crm-team-feedback-list">
      {feedbacks.map((feedback) => (
        <div key={feedback.id} className="crm-team-feedback-item">
          <div className="crm-int-card-top">
            <div>
              <span className={`crm-badge ${FEEDBACK_TYPE_BADGE[feedback.type]}`}>
                {FEEDBACK_TYPE_LABEL[feedback.type]}
              </span>{" "}
              {showRecipient && feedback.recipientName && (
                <span className="crm-card-sub">para {feedback.recipientName}</span>
              )}
            </div>
            <span className="crm-card-sub">{formatDate(feedback.createdAt)}</span>
          </div>
          <p>{feedback.comment}</p>
          <div className="crm-int-card-top">
            <span className="crm-card-sub">De {feedback.authorName ?? "—"}</span>
            {feedback.status !== "arquivado" && (
              <button
                type="button"
                className="btn btn-outline"
                disabled={isPending}
                onClick={() => archive(feedback.id)}
              >
                Arquivar
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
