import type { Metadata } from "next";
import { PipelineBoard } from "@/components/kanban/PipelineBoard";
import { getPipelineColumns } from "@/lib/crm/mockData";

export const metadata: Metadata = {
  title: "Pipeline — Brusync OS",
  robots: { index: false, follow: false },
};

export default function PipelinePage() {
  const columns = getPipelineColumns();

  return (
    <div>
      <div className="crm-page-head">
        <div>
          <h1 className="crm-page-title">Pipeline</h1>
          <p className="crm-page-sub">Funil comercial por estágio</p>
        </div>
        <div className="crm-page-actions">
          <button type="button" className="btn btn-accent">
            Novo Lead
          </button>
        </div>
      </div>

      <PipelineBoard columns={columns} />
    </div>
  );
}
