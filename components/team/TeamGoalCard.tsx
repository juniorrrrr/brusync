"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { archiveTeamGoalAction } from "@/application/team/teamGoalsActions";
import { IconArchive, IconPencil } from "@/components/ui/icons";
import { useTeamGoalEditor } from "@/contexts/team/TeamGoalEditorContext";
import { PROGRESS_STATUS_BADGE, PROGRESS_STATUS_LABEL } from "@/domain/performance/scoring";
import {
  formatTeamGoalValue,
  TEAM_GOAL_PERIOD_LABEL,
  TEAM_GOAL_TYPE_META,
} from "@/domain/team/goalTypes";
import type { TeamGoalWithProgress } from "@/types/team";

export function TeamGoalCard({
  goal,
  showMemberName = false,
}: {
  goal: TeamGoalWithProgress;
  showMemberName?: boolean;
}) {
  const { openEdit } = useTeamGoalEditor();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const meta = TEAM_GOAL_TYPE_META[goal.type];

  function handleArchive() {
    startTransition(async () => {
      await archiveTeamGoalAction(goal.id);
      router.refresh();
    });
  }

  const percent =
    goal.percentComplete !== null ? Math.min(Math.max(goal.percentComplete, 0), 100) : 0;
  const badge = goal.progressStatus ? PROGRESS_STATUS_BADGE[goal.progressStatus] : "neutral";
  const badgeLabel = goal.progressStatus ? PROGRESS_STATUS_LABEL[goal.progressStatus] : "Sem dado";

  return (
    <div className="crm-card crm-card-pad crm-perf-goal-card">
      <div className="crm-int-card-top">
        <div>
          <div className="crm-int-card-title">{meta.label}</div>
          <div className="crm-int-card-desc">
            {showMemberName && goal.memberName ? `${goal.memberName} · ` : ""}
            {TEAM_GOAL_PERIOD_LABEL[goal.periodType]}
          </div>
        </div>
        <span className={`crm-badge ${badge}`}>{badgeLabel}</span>
      </div>

      <div className="crm-perf-progress-bar">
        <div className="crm-perf-progress-fill" style={{ width: `${percent}%` }} />
      </div>

      <div className="crm-perf-goal-values">
        <strong>
          {goal.actualValue !== null ? formatTeamGoalValue(goal.actualValue, meta.unit) : "—"}
        </strong>
        <span className="crm-card-sub">de {formatTeamGoalValue(goal.targetValue, meta.unit)}</span>
      </div>

      <div className="crm-int-card-actions">
        <button type="button" className="btn btn-outline" onClick={() => openEdit(goal)}>
          <IconPencil size={13} /> Editar
        </button>
        {goal.status === "ativa" && (
          <button
            type="button"
            className="btn btn-outline"
            disabled={isPending}
            onClick={handleArchive}
          >
            <IconArchive size={13} /> Arquivar
          </button>
        )}
      </div>
    </div>
  );
}
