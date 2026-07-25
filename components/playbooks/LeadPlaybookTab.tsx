"use client";

import { useEffect, useState } from "react";
import { fetchLeadPlaybookAction } from "@/application/playbooks/playbooksActions";
import { PlaybookStepPanel } from "@/components/playbooks/PlaybookStepPanel";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { PLAYBOOK_CATEGORY_LABEL } from "@/domain/playbooks/statusMeta";
import type { PlaybookDetail } from "@/types/playbooks";

export function LeadPlaybookTab({ crmLeadId }: { crmLeadId: string }) {
  const [playbook, setPlaybook] = useState<PlaybookDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchLeadPlaybookAction(crmLeadId).then((data) => {
      if (!cancelled) {
        setPlaybook(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [crmLeadId]);

  if (loading) {
    return (
      <div>
        <Skeleton style={{ height: 90, marginBottom: 12 }} />
        <Skeleton style={{ height: 180 }} />
      </div>
    );
  }

  if (!playbook) {
    return (
      <Empty>
        <EmptyTitle>Nenhum playbook vinculado</EmptyTitle>
        <EmptyDescription>
          Cadastre um playbook ativo para a etapa atual do pipeline.
        </EmptyDescription>
      </Empty>
    );
  }

  return (
    <div>
      <div className="crm-card crm-card-pad" style={{ marginBottom: 12 }}>
        <div className="crm-card-title">{playbook.name}</div>
        <p className="crm-card-sub" style={{ marginTop: 6 }}>
          {PLAYBOOK_CATEGORY_LABEL[playbook.category]} ·{" "}
          {playbook.pipelineStageName ?? "Etapa atual"}
        </p>
        <p className="crm-card-sub">{playbook.objective}</p>
      </div>
      <div style={{ display: "grid", gap: 12 }}>
        {playbook.steps.map((step) => (
          <PlaybookStepPanel key={step.id} step={step} />
        ))}
      </div>
    </div>
  );
}
