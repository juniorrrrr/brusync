"use client";

import { useState } from "react";
import type { CampaignSortKey } from "@/application/marketingAnalytics/campaignsQueries";
import { CampaignSpendModal } from "@/components/marketing/CampaignSpendModal";
import { MetricValue } from "@/components/marketing/MetricValue";
import { IconSearch, IconSort } from "@/components/ui/icons";
import { formatCurrencyBRL, formatPercent } from "@/domain/crm/format";
import { formatMetric, formatRoas, formatSignedPercent } from "@/domain/marketing/format";
import { MARKETING_ORIGIN_LABEL } from "@/domain/marketing/originRules";
import { useUpdateSearchParams } from "@/hooks/crm/useUpdateSearchParams";
import type { CampaignRow } from "@/types/marketing";

const COLUMNS: { key: CampaignSortKey | null; label: string }[] = [
  { key: null, label: "Campanha" },
  { key: null, label: "Origem" },
  { key: "investment", label: "Investimento" },
  { key: "leads", label: "Leads" },
  { key: null, label: "Qualificados" },
  { key: "clients", label: "Clientes" },
  { key: "revenue", label: "Receita" },
  { key: "roas", label: "ROAS" },
  { key: "roi", label: "ROI" },
  { key: "conversionRate", label: "Conversão" },
];

export function CampaignsTable({
  rows,
  sortBy,
  sortDir,
  search,
}: {
  rows: CampaignRow[];
  sortBy: CampaignSortKey;
  sortDir: "asc" | "desc";
  search: string;
}) {
  const { update } = useUpdateSearchParams();
  const [searchValue, setSearchValue] = useState(search);
  const [spendTarget, setSpendTarget] = useState<{ utmSource: string; utmCampaign: string } | null>(
    null,
  );

  function handleSort(key: CampaignSortKey) {
    const nextDir = sortBy === key && sortDir === "asc" ? "desc" : "asc";
    update({ sort: key, dir: nextDir }, { resetPage: true });
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    update({ q: searchValue || null }, { resetPage: true });
  }

  return (
    <>
      <div className="crm-toolbar">
        <form className="crm-search" onSubmit={handleSearchSubmit}>
          <IconSearch />
          <input
            type="text"
            placeholder="Buscar por campanha ou origem…"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
        </form>
      </div>

      <div className="crm-table-wrap">
        <table className="crm-table">
          <thead>
            <tr>
              {COLUMNS.map((column) => (
                <th key={column.label}>
                  {column.key ? (
                    <button
                      type="button"
                      className={`crm-sort-btn${sortBy === column.key ? " active" : ""}`}
                      onClick={() => handleSort(column.key as CampaignSortKey)}
                    >
                      {column.label} <IconSort size={11} />{" "}
                      {sortBy === column.key ? (sortDir === "asc" ? "↑" : "↓") : ""}
                    </button>
                  ) : (
                    column.label
                  )}
                </th>
              ))}
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key}>
                <td className="cell-strong">{row.utmCampaign || "(não informado)"}</td>
                <td className="cell-muted">{MARKETING_ORIGIN_LABEL[row.origin]}</td>
                <td>
                  <MetricValue
                    available={row.investment.available}
                    formatted={formatMetric(row.investment, formatCurrencyBRL)}
                  />
                </td>
                <td>{row.leads}</td>
                <td className="cell-muted">{row.qualifiedLeads}</td>
                <td>{row.clients}</td>
                <td className="cell-muted">{formatCurrencyBRL(row.revenue)}</td>
                <td>
                  <MetricValue
                    available={row.roas.available}
                    formatted={formatMetric(row.roas, formatRoas)}
                  />
                </td>
                <td>
                  <MetricValue
                    available={row.roi.available}
                    formatted={formatMetric(row.roi, (v) => formatSignedPercent(v))}
                  />
                </td>
                <td className="cell-muted">{formatPercent(row.conversionRate)}</td>
                <td>
                  {row.utmSource && row.utmCampaign && (
                    <button
                      type="button"
                      className="btn btn-outline"
                      style={{ padding: "4px 10px", fontSize: 12 }}
                      onClick={() =>
                        setSpendTarget({
                          utmSource: row.utmSource as string,
                          utmCampaign: row.utmCampaign as string,
                        })
                      }
                    >
                      Lançar investimento
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={COLUMNS.length + 1}
                  className="cell-muted"
                  style={{ textAlign: "center", padding: 24 }}
                >
                  Nenhuma campanha encontrada para os filtros atuais.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {spendTarget && (
        <CampaignSpendModal
          utmSource={spendTarget.utmSource}
          utmCampaign={spendTarget.utmCampaign}
          onClose={() => setSpendTarget(null)}
        />
      )}
    </>
  );
}
