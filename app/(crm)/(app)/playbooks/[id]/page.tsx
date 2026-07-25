import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchPlaybookDetail } from "@/application/playbooks/playbooksQueries";
import { PlaybookStepPanel } from "@/components/playbooks/PlaybookStepPanel";
import {
  PLAYBOOK_CATEGORY_LABEL,
  PLAYBOOK_STATUS_BADGE,
  PLAYBOOK_STATUS_LABEL,
} from "@/domain/playbooks/statusMeta";

export const metadata: Metadata = {
  title: "Playbook — Brusync OS",
};

export default async function PlaybookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const playbook = await fetchPlaybookDetail(id);
  if (!playbook) notFound();

  return (
    <div>
      <div className="crm-card crm-card-pad">
        <div className="crm-int-card-top">
          <div>
            <div className="crm-page-title" style={{ fontSize: 24 }}>
              {playbook.name}
            </div>
            <p className="crm-card-sub" style={{ marginTop: 6 }}>
              {PLAYBOOK_CATEGORY_LABEL[playbook.category]} · {playbook.pipeline ?? "Pipeline"} ·{" "}
              {playbook.pipelineStageName ?? "Etapa"}
            </p>
          </div>
          <span className={`crm-badge ${PLAYBOOK_STATUS_BADGE[playbook.status]}`}>
            {PLAYBOOK_STATUS_LABEL[playbook.status]} · v{playbook.version}
          </span>
        </div>
        <p className="crm-card-sub">{playbook.objective}</p>
        <div className="crm-proc-card-meta">
          <span>Responsável: {playbook.ownerName ?? "Sem responsável"}</span>
          <span>{playbook.executionCount} execuções</span>
          <span>
            {playbook.completedStepCount}/{playbook.stepCount} etapas concluídas
          </span>
        </div>
      </div>

      <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
        {playbook.steps.map((step) => (
          <PlaybookStepPanel key={step.id} step={step} />
        ))}
      </div>
    </div>
  );
}
