import type { Metadata } from "next";
import { LeadsTable } from "@/components/table/LeadsTable";
import { MOCK_LEADS } from "@/lib/crm/mockData";

export const metadata: Metadata = {
  title: "Leads — Brusync OS",
  robots: { index: false, follow: false },
};

export default function LeadsPage() {
  return (
    <div>
      <div className="crm-page-head">
        <div>
          <h1 className="crm-page-title">Leads</h1>
          <p className="crm-page-sub">{MOCK_LEADS.length} leads no funil comercial</p>
        </div>
        <div className="crm-page-actions">
          <button type="button" className="btn btn-outline">
            Filtrar
          </button>
          <button type="button" className="btn btn-accent">
            Novo Lead
          </button>
        </div>
      </div>

      <div className="crm-card">
        <LeadsTable leads={MOCK_LEADS} />
      </div>
    </div>
  );
}
