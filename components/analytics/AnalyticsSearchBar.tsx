"use client";

import Link from "next/link";
import { IconSearch } from "@/components/ui/icons";
import { useAnalyticsSearch } from "@/hooks/analytics/useAnalyticsSearch";

const KIND_LABEL: Record<string, string> = {
  dashboard: "Dashboard",
  widget: "Widget",
  metric: "Métrica",
};

export function AnalyticsSearchBar() {
  const { query, setQuery, results, isPending } = useAnalyticsSearch();

  return (
    <div className="crm-an-search">
      <div className="crm-field">
        <label htmlFor="an-search">
          <IconSearch size={13} /> Pesquisar dashboards, widgets e métricas
        </label>
        <input
          id="an-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ex.: receita, campanha, ranking da equipe…"
        />
      </div>
      {query.trim() && (
        <div className="crm-card crm-card-pad" style={{ marginTop: 8 }}>
          {isPending && <p className="crm-card-sub">Buscando…</p>}
          {!isPending && results.length === 0 && <p className="crm-card-sub">Nada encontrado.</p>}
          <div className="crm-mini-list">
            {results.map((result) => (
              <div key={`${result.kind}-${result.id}`} className="crm-an-row">
                {result.href ? (
                  <Link href={result.href}>{result.label}</Link>
                ) : (
                  <span>{result.label}</span>
                )}
                <span className="crm-card-sub">
                  {KIND_LABEL[result.kind]}
                  {result.description ? ` · ${result.description}` : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
