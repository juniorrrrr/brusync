"use client";

import { useEffect, useState } from "react";
import { FINANCIAL_STATUSES, financialStatusLabel } from "@/domain/financial/types";
import { useUpdateSearchParams } from "@/hooks/crm/useUpdateSearchParams";
import type { FinancialCategory } from "@/types/financial";

export function FinancialFilterBar({
  categories,
  clients,
}: {
  categories: FinancialCategory[];
  clients: { id: string; company: string }[];
}) {
  const { update, searchParams } = useUpdateSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const kind = searchParams.get("kind") ?? "";

  // biome-ignore lint/correctness/useExhaustiveDependencies: update is stable (see useUpdateSearchParams); only search should re-trigger the debounce.
  useEffect(() => {
    const timeout = setTimeout(() => update({ q: search || null }), 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const relevantCategories = kind ? categories.filter((c) => c.kind === kind) : categories;

  return (
    <div className="crm-toolbar" style={{ flexWrap: "wrap" }}>
      <input
        type="text"
        className="crm-select"
        placeholder="Buscar por descrição…"
        style={{ width: 220 }}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        aria-label="Buscar"
      />

      <select
        className="crm-select"
        value={kind}
        onChange={(e) => update({ kind: e.target.value || null, categoryId: null })}
        aria-label="Tipo"
      >
        <option value="">Receitas e despesas</option>
        <option value="receita">Receitas</option>
        <option value="despesa">Despesas</option>
      </select>

      <select
        className="crm-select"
        value={searchParams.get("status") ?? ""}
        onChange={(e) => update({ status: e.target.value || null })}
        aria-label="Status"
      >
        <option value="">Todos os status</option>
        {FINANCIAL_STATUSES.map((status) => (
          <option key={status} value={status}>
            {financialStatusLabel(status, kind === "despesa" ? "despesa" : "receita")}
          </option>
        ))}
      </select>

      <select
        className="crm-select"
        value={searchParams.get("categoryId") ?? ""}
        onChange={(e) => update({ categoryId: e.target.value || null })}
        aria-label="Categoria"
      >
        <option value="">Todas as categorias</option>
        {relevantCategories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>

      <select
        className="crm-select"
        value={searchParams.get("clientId") ?? ""}
        onChange={(e) => update({ clientId: e.target.value || null })}
        aria-label="Cliente"
      >
        <option value="">Todos os clientes</option>
        {clients.map((client) => (
          <option key={client.id} value={client.id}>
            {client.company}
          </option>
        ))}
      </select>

      <span className="crm-card-sub" style={{ margin: 0 }}>
        Vencimento
      </span>
      <input
        type="date"
        className="crm-select"
        value={searchParams.get("dueFrom") ?? ""}
        onChange={(e) => update({ dueFrom: e.target.value || null })}
        aria-label="Vencimento de"
      />
      <input
        type="date"
        className="crm-select"
        value={searchParams.get("dueTo") ?? ""}
        onChange={(e) => update({ dueTo: e.target.value || null })}
        aria-label="Vencimento até"
      />
    </div>
  );
}
