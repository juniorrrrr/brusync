import type { Metadata } from "next";
import { getOwnerOptions, getPipelineData } from "@/application/crm/leadsQueries";
import { CreateLeadDialog } from "@/components/crm/leads/CreateLeadDialog";
import { PipelineBoard } from "@/components/kanban/PipelineBoard";

export const metadata: Metadata = {
  title: "Pipeline — Brusync OS",
  robots: { index: false, follow: false },
};

export default async function PipelinePage() {
  const [{ columns }, owners] = await Promise.all([getPipelineData(), getOwnerOptions()]);

  return (
    <div>
      <div className="crm-page-head">
        <div>
          <h1 className="crm-page-title">Pipeline</h1>
          <p className="crm-page-sub">Funil comercial por estágio — arraste para mover</p>
        </div>
        <div className="crm-page-actions">
          <CreateLeadDialog owners={owners} />
        </div>
      </div>

      <PipelineBoard initialColumns={columns} />
    </div>
  );
}
