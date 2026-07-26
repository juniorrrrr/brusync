"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { updateTeamCheckinStatusAction } from "@/application/team/teamCheckinsActions";
import {
  CHECKIN_STATUS_BADGE,
  CHECKIN_STATUS_LABEL,
  CHECKIN_TYPE_LABEL,
} from "@/domain/team/statusMeta";
import type { TeamCheckin } from "@/types/team";

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function TeamCheckinList({
  checkins,
  showMemberName = false,
}: {
  checkins: TeamCheckin[];
  showMemberName?: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function markDone(id: string) {
    startTransition(async () => {
      await updateTeamCheckinStatusAction(id, "realizado");
      router.refresh();
    });
  }

  if (checkins.length === 0) {
    return <p className="crm-card-sub">Nenhum check-in registrado ainda.</p>;
  }

  return (
    <div className="crm-proc-steps-list">
      {checkins.map((checkin) => (
        <div key={checkin.id} className="crm-proc-step">
          <div className="crm-int-card-top">
            <div>
              <div className="crm-int-card-title">
                {CHECKIN_TYPE_LABEL[checkin.type] ?? checkin.type}
                {showMemberName && checkin.memberName ? ` · ${checkin.memberName}` : ""}
              </div>
              <div className="crm-int-card-desc">{formatDateTime(checkin.scheduledAt)}</div>
            </div>
            <span className={`crm-badge ${CHECKIN_STATUS_BADGE[checkin.status]}`}>
              {CHECKIN_STATUS_LABEL[checkin.status]}
            </span>
          </div>
          {checkin.notes && <p className="crm-card-sub">{checkin.notes}</p>}
          <div className="crm-int-card-top">
            <span className="crm-card-sub">Com {checkin.authorName ?? "—"}</span>
            {checkin.status === "agendado" && (
              <button
                type="button"
                className="btn btn-outline"
                disabled={isPending}
                onClick={() => markDone(checkin.id)}
              >
                Marcar como realizado
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
