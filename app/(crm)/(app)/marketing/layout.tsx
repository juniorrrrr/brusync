import type { ReactNode } from "react";
import { getOwnerOptions } from "@/application/crm/leadsQueries";
import { MarketingFilterBar } from "@/components/marketing/MarketingFilterBar";
import { MarketingSubNav } from "@/components/marketing/MarketingSubNav";
import { listPipelineStages } from "@/repositories/crm/pipelineStagesRepository";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import "@/styles/marketing.css";

export default async function MarketingLayout({ children }: { children: ReactNode }) {
  const supabase = await getSupabaseAuthClient();
  const [owners, stages] = await Promise.all([getOwnerOptions(), listPipelineStages(supabase)]);

  return (
    <div>
      <div className="crm-page-head">
        <div>
          <h1 className="crm-page-title">Marketing Intelligence</h1>
          <p className="crm-page-sub">Marketing e Comercial conectados de ponta a ponta</p>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <MarketingSubNav />
      </div>

      <MarketingFilterBar owners={owners} stages={stages} />

      {children}
    </div>
  );
}
