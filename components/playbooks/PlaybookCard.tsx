import Link from "next/link";
import {
  PLAYBOOK_CATEGORY_LABEL,
  PLAYBOOK_STATUS_BADGE,
  PLAYBOOK_STATUS_LABEL,
} from "@/domain/playbooks/statusMeta";
import type { PlaybookSummary } from "@/types/playbooks";

function formatMinutes(minutes: number | null): string {
  if (minutes === null) return "—";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest > 0 ? `${hours}h${String(rest).padStart(2, "0")}` : `${hours}h`;
}

export function PlaybookCard({ playbook }: { playbook: PlaybookSummary }) {
  const percent =
    playbook.stepCount > 0
      ? Math.round((playbook.completedStepCount / playbook.stepCount) * 100)
      : 0;

  return (
    <div className="crm-card crm-card-pad">
      <div className="crm-int-card-top">
        <div>
          <Link href={`/playbooks/${playbook.id}`} className="crm-proc-card-title">
            {playbook.name}
          </Link>
          <div className="crm-int-card-desc">
            {PLAYBOOK_CATEGORY_LABEL[playbook.category]} ·{" "}
            {playbook.pipelineStageName ?? "Sem etapa"}
          </div>
        </div>
        <span className={`crm-badge ${PLAYBOOK_STATUS_BADGE[playbook.status]}`}>
          {PLAYBOOK_STATUS_LABEL[playbook.status]}
        </span>
      </div>
      <p className="crm-card-sub" style={{ marginTop: 10 }}>
        {playbook.description}
      </p>
      <div className="crm-proc-progress-bar">
        <div className="crm-proc-progress-fill" style={{ width: `${percent}%` }} />
      </div>
      <div className="crm-proc-card-meta">
        <span>
          {playbook.completedStepCount}/{playbook.stepCount} etapas
        </span>
        <span>{playbook.executionCount} execuções</span>
        <span>{formatMinutes(playbook.averageStepMinutes)} por etapa</span>
      </div>
      <div className="crm-int-card-actions">
        <Link href={`/playbooks/${playbook.id}`} className="btn btn-outline">
          Abrir guia
        </Link>
      </div>
    </div>
  );
}
