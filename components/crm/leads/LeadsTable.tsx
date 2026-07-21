"use client";

import { useMemo, useState, useTransition } from "react";
import { bulkUpdateLeadsAction } from "@/application/crm/leadsActions";
import { IconSort } from "@/components/ui/icons";
import { useLeadDrawer } from "@/contexts/crm/LeadDrawerContext";
import { formatCurrencyBRL, formatDate, initials } from "@/domain/crm/format";
import { isAwaitingContact } from "@/domain/crm/leadRules";
import { useUpdateSearchParams } from "@/hooks/crm/useUpdateSearchParams";
import type { CrmLeadWithRelations, PipelineStage } from "@/types/crm";

type SortKey = "created_at" | "name" | "potential_value" | "score" | "last_interaction_at";

const COLUMNS: { key: SortKey | null; label: string }[] = [
  { key: null, label: "Lead" },
  { key: null, label: "Empresa" },
  { key: null, label: "Origem" },
  { key: null, label: "Estágio" },
  { key: "potential_value", label: "Valor potencial" },
  { key: null, label: "Responsável" },
  { key: "created_at", label: "Criado em" },
  { key: "last_interaction_at", label: "Última interação" },
  { key: null, label: "Tags" },
  { key: "score", label: "Score" },
];

export function LeadsTable({
  leads,
  stages,
  owners,
  sortBy,
  sortDir,
}: {
  leads: CrmLeadWithRelations[];
  stages: PipelineStage[];
  owners: { id: string; name: string | null; email: string | null }[];
  sortBy: string;
  sortDir: string;
}) {
  const { update } = useUpdateSearchParams();
  const { openLead } = useLeadDrawer();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  const allSelected = leads.length > 0 && selected.size === leads.length;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(leads.map((l) => l.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSort(key: SortKey) {
    const nextDir = sortBy === key && sortDir === "asc" ? "desc" : "asc";
    update({ sort: key, dir: nextDir });
  }

  function applyBulkStage(stageId: string) {
    if (!stageId || selected.size === 0) return;
    startTransition(async () => {
      await bulkUpdateLeadsAction([...selected], { stageId });
      setSelected(new Set());
    });
  }

  function applyBulkOwner(ownerId: string) {
    if (!ownerId || selected.size === 0) return;
    startTransition(async () => {
      await bulkUpdateLeadsAction([...selected], { ownerId });
      setSelected(new Set());
    });
  }

  const selectedCount = selected.size;
  const sortIndicator = useMemo(
    () => (key: SortKey) => (sortBy === key ? (sortDir === "asc" ? "↑" : "↓") : ""),
    [sortBy, sortDir],
  );

  return (
    <>
      {selectedCount > 0 && (
        <div className="crm-bulkbar">
          <span>{selectedCount} selecionado(s)</span>
          <select
            className="crm-select"
            defaultValue=""
            disabled={isPending}
            onChange={(e) => applyBulkStage(e.target.value)}
          >
            <option value="">Mover para estágio…</option>
            {stages.map((stage) => (
              <option key={stage.id} value={stage.id}>
                {stage.label}
              </option>
            ))}
          </select>
          <select
            className="crm-select"
            defaultValue=""
            disabled={isPending}
            onChange={(e) => applyBulkOwner(e.target.value)}
          >
            <option value="">Atribuir responsável…</option>
            {owners.map((owner) => (
              <option key={owner.id} value={owner.id}>
                {owner.name || owner.email}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="crm-table-wrap">
        <table className="crm-table">
          <thead>
            <tr>
              <th className="crm-th-check">
                <input
                  type="checkbox"
                  className="crm-checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label="Selecionar todos"
                />
              </th>
              {COLUMNS.map((col) => (
                <th key={col.label}>
                  {col.key ? (
                    <button
                      type="button"
                      className={`crm-sort-btn${sortBy === col.key ? " active" : ""}`}
                      onClick={() => handleSort(col.key as SortKey)}
                    >
                      {col.label} <IconSort size={11} /> {sortIndicator(col.key)}
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id}>
                <td>
                  <input
                    type="checkbox"
                    className="crm-checkbox"
                    checked={selected.has(lead.id)}
                    onChange={() => toggleOne(lead.id)}
                    aria-label={`Selecionar ${lead.name}`}
                  />
                </td>
                <td>
                  <button
                    type="button"
                    className="cell-strong"
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                    onClick={() => openLead(lead.id)}
                  >
                    <span className="crm-avatar" style={{ width: 26, height: 26, fontSize: 10 }}>
                      {initials(lead.name)}
                    </span>
                    {lead.name}
                  </button>
                </td>
                <td className="cell-muted">{lead.company || "—"}</td>
                <td className="cell-muted">{lead.origin || "—"}</td>
                <td>
                  <span className={`crm-badge ${lead.stage.color}`}>{lead.stage.label}</span>
                  {isAwaitingContact(lead) && (
                    <span className="crm-badge warn" style={{ marginLeft: 6 }}>
                      Aguardando
                    </span>
                  )}
                </td>
                <td className="cell-muted">{formatCurrencyBRL(lead.potentialValue)}</td>
                <td className="cell-muted">{lead.owner?.name || lead.owner?.email || "—"}</td>
                <td className="cell-muted">{formatDate(lead.createdAt)}</td>
                <td className="cell-muted">
                  {lead.lastInteractionAt ? formatDate(lead.lastInteractionAt) : "—"}
                </td>
                <td>
                  {lead.tags.length > 0 ? (
                    <div className="crm-tags">
                      {lead.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="crm-tag">
                          {tag}
                        </span>
                      ))}
                      {lead.tags.length > 2 && (
                        <span className="crm-tag">+{lead.tags.length - 2}</span>
                      )}
                    </div>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="cell-muted">{lead.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
