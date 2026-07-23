import Link from "next/link";
import { formatDateTime } from "@/domain/crm/format";
import { PROJECT_STATUS_BADGE, PROJECT_STATUS_LABEL } from "@/domain/projects/types";
import type { Project } from "@/types/projects";

export function PortalProjectCard({ project }: { project: Project }) {
  return (
    <Link href={`/portal/projetos/${project.id}`} className="crm-pt-project-card">
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <strong style={{ fontSize: 15 }}>{project.name}</strong>
        <span className={`crm-badge ${PROJECT_STATUS_BADGE[project.status]}`}>
          {PROJECT_STATUS_LABEL[project.status]}
        </span>
      </div>
      <div className="crm-pj-desc">
        {project.dueAt ? `Prazo: ${formatDateTime(project.dueAt)}` : "Sem prazo definido"}
      </div>
      <div className="crm-pj-progress-track" style={{ marginTop: 10, maxWidth: 320 }}>
        <div className="crm-pj-progress-fill" style={{ width: `${project.progressPercent}%` }} />
      </div>
      <span className="crm-card-sub" style={{ marginTop: 6, display: "inline-block" }}>
        {project.progressPercent}% concluído
      </span>
    </Link>
  );
}
