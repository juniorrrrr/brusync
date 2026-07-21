"use client";

import { useState } from "react";
import { LeadDrawerActivities } from "@/components/crm/leadDrawer/LeadDrawerActivities";
import { LeadDrawerFiles } from "@/components/crm/leadDrawer/LeadDrawerFiles";
import { LeadDrawerOrigin } from "@/components/crm/leadDrawer/LeadDrawerOrigin";
import { LeadDrawerSummary } from "@/components/crm/leadDrawer/LeadDrawerSummary";
import { IconX } from "@/components/ui/icons";
import { useLeadDrawer } from "@/contexts/crm/LeadDrawerContext";
import { initials } from "@/domain/crm/format";

type Tab = "resumo" | "atividades" | "arquivos" | "origem";

const TABS: { key: Tab; label: string }[] = [
  { key: "resumo", label: "Resumo" },
  { key: "atividades", label: "Atividades" },
  { key: "arquivos", label: "Arquivos" },
  { key: "origem", label: "Origem" },
];

export function LeadDrawer() {
  const { leadId, data, loading, error, close, refresh } = useLeadDrawer();
  const [tab, setTab] = useState<Tab>("resumo");
  const open = leadId !== null;

  return (
    <>
      <button
        type="button"
        aria-label="Fechar"
        className={`crm-drawer-overlay${open ? " open" : ""}`}
        onClick={close}
      />
      <aside className={`crm-drawer${open ? " open" : ""}`} aria-hidden={!open}>
        {loading && <div className="crm-drawer-loading">Carregando lead…</div>}
        {!loading && error && <div className="crm-drawer-empty">{error}</div>}
        {!loading && data && (
          <>
            <div className="crm-drawer-head">
              <div className="crm-lead-head" style={{ marginBottom: 0 }}>
                <div className="crm-lead-avatar">{initials(data.lead.name)}</div>
                <div>
                  <div className="crm-lead-name">{data.lead.name}</div>
                  <div className="crm-lead-company">{data.lead.company || "Sem empresa"}</div>
                </div>
              </div>
              <button type="button" className="crm-drawer-close" onClick={close}>
                <IconX size={16} />
              </button>
            </div>

            <div className="crm-drawer-tabs">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  className={`crm-drawer-tab${tab === t.key ? " active" : ""}`}
                  onClick={() => setTab(t.key)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="crm-drawer-body">
              {tab === "resumo" && (
                <LeadDrawerSummary lead={data.lead} owners={data.owners} onSaved={refresh} />
              )}
              {tab === "atividades" && (
                <LeadDrawerActivities
                  crmLeadId={data.lead.id}
                  activities={data.activities}
                  onChanged={refresh}
                />
              )}
              {tab === "arquivos" && (
                <LeadDrawerFiles crmLeadId={data.lead.id} files={data.files} onChanged={refresh} />
              )}
              {tab === "origem" && (
                <LeadDrawerOrigin
                  sourceAttribution={data.sourceAttribution}
                  materialDownloads={data.materialDownloads}
                />
              )}
            </div>
          </>
        )}
      </aside>
    </>
  );
}
