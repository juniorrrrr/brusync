"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { archiveGoalAction } from "@/application/performance/performanceGoalsActions";
import { IconArchive, IconPencil } from "@/components/ui/icons";
import { useGoalEditor } from "@/contexts/performance/GoalEditorContext";
import { formatGoalValue, GOAL_PERIOD_LABEL, GOAL_TYPE_META } from "@/domain/performance/goalTypes";
import { PROGRESS_STATUS_BADGE, PROGRESS_STATUS_LABEL } from "@/domain/performance/scoring";
import type { GoalWithProgress } from "@/types/performance";

export function GoalCard({ goal }: { goal: GoalWithProgress }) {
  const { openEdit } = useGoalEditor();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const meta = GOAL_TYPE_META[goal.type];

  function handleArchive() {
    startTransition(async () => {
      await archiveGoalAction(goal.id);
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
            {goal.scopeLabel} · {GOAL_PERIOD_LABEL[goal.periodType]}
          </div>
        </div>
        <span className={`crm-badge ${badge}`}>{badgeLabel}</span>
      </div>

      <div className="crm-perf-progress-bar">
        <div className="crm-perf-progress-fill" style={{ width: `${percent}%` }} />
      </div>

      <div className="crm-perf-goal-values">
        <strong>
          {goal.actualValue !== null ? formatGoalValue(goal.actualValue, meta.unit) : "—"}
        </strong>
        <span className="crm-card-sub">de {formatGoalValue(goal.targetValue, meta.unit)}</span>
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
