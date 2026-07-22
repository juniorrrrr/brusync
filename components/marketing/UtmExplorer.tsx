"use client";

import { useLeadDrawer } from "@/contexts/crm/LeadDrawerContext";
import { formatDate } from "@/domain/crm/format";
import { useUpdateSearchParams } from "@/hooks/crm/useUpdateSearchParams";
import type { UtmFacets, UtmLeadRow } from "@/types/marketing";

const DIMENSIONS: {
  key: "utm_source" | "utm_medium" | "utm_campaign" | "utm_content" | "utm_term";
  label: string;
  facetKey: keyof UtmFacets;
}[] = [
  { key: "utm_source", label: "Origem (utm_source)", facetKey: "utmSource" },
  { key: "utm_medium", label: "Mídia (utm_medium)", facetKey: "utmMedium" },
  { key: "utm_campaign", label: "Campanha (utm_campaign)", facetKey: "utmCampaign" },
  { key: "utm_content", label: "Conteúdo (utm_content)", facetKey: "utmContent" },
  { key: "utm_term", label: "Termo (utm_term)", facetKey: "utmTerm" },
];

export function UtmExplorer({
  facets,
  leads,
  selected,
}: {
  facets: UtmFacets;
  leads: UtmLeadRow[];
  selected: Record<string, string | undefined>;
}) {
  const { update } = useUpdateSearchParams();
  const { openLead } = useLeadDrawer();
  const hasSelection = Object.values(selected).some(Boolean);

  return (
    <div className="crm-row" style={{ alignItems: "flex-start" }}>
      <div className="crm-card crm-card-pad" style={{ maxWidth: 320, minWidth: 260 }}>
        <div className="crm-card-title">Explorador de UTMs</div>
        {DIMENSIONS.map((dim) => (
          <div key={dim.key} style={{ marginTop: 14 }}>
            <div className="crm-card-sub" style={{ marginBottom: 6 }}>
              {dim.label}
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
                maxHeight: 160,
                overflowY: "auto",
              }}
            >
              {facets[dim.facetKey].map((facet) => {
                const isActive = selected[dim.key] === facet.value;
                return (
                  <button
                    key={facet.value}
                    type="button"
                    className={`crm-badge ${isActive ? "info" : "neutral"}`}
                    style={{
                      justifyContent: "space-between",
                      cursor: "pointer",
                      width: "100%",
                      display: "flex",
                    }}
                    onClick={() =>
                      update({ [dim.key]: isActive ? null : facet.value }, { resetPage: true })
                    }
                  >
                    <span>{facet.value}</span>
                    <span>{facet.count}</span>
                  </button>
                );
              })}
              {facets[dim.facetKey].length === 0 && (
                <span className="cell-muted" style={{ fontSize: 12 }}>
                  Nenhum valor
                </span>
              )}
            </div>
          </div>
        ))}
        {hasSelection && (
          <button
            type="button"
            className="btn btn-outline"
            style={{ marginTop: 16, width: "100%" }}
            onClick={() =>
              update({
                utm_source: null,
                utm_medium: null,
                utm_campaign: null,
                utm_content: null,
                utm_term: null,
              })
            }
          >
            Limpar filtros de UTM
          </button>
        )}
      </div>

      <div className="crm-card" style={{ flex: 1, minWidth: 0 }}>
        <div className="crm-table-wrap">
          <table className="crm-table">
            <thead>
              <tr>
                <th>Lead</th>
                <th>Estágio</th>
                <th>Origem</th>
                <th>Mídia</th>
                <th>Campanha</th>
                <th>Conteúdo</th>
                <th>Termo</th>
                <th>Criado em</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.crmLeadId}>
                  <td>
                    <button
                      type="button"
                      className="cell-strong"
                      onClick={() => openLead(lead.crmLeadId)}
                    >
                      {lead.name}
                    </button>
                  </td>
                  <td>
                    <span className={`crm-badge ${lead.stageColor}`}>{lead.stageLabel}</span>
                  </td>
                  <td className="cell-muted">{lead.utmSource || "—"}</td>
                  <td className="cell-muted">{lead.utmMedium || "—"}</td>
                  <td className="cell-muted">{lead.utmCampaign || "—"}</td>
                  <td className="cell-muted">{lead.utmContent || "—"}</td>
                  <td className="cell-muted">{lead.utmTerm || "—"}</td>
                  <td className="cell-muted">{formatDate(lead.createdAt)}</td>
                </tr>
              ))}
              {leads.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="cell-muted"
                    style={{ textAlign: "center", padding: 24 }}
                  >
                    Nenhum lead encontrado para os filtros de UTM selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
