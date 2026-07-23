"use client";

import { useEffect, useState } from "react";
import { useUpdateSearchParams } from "@/hooks/crm/useUpdateSearchParams";
import type { AutomationWorkflow } from "@/types/automation";

export function LogsFilterBar({ workflows }: { workflows: AutomationWorkflow[] }) {
  const { update, searchParams } = useUpdateSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") ?? "");

  useEffect(() => {
    const timeout = setTimeout(() => update({ q: search || null }), 300);
    return () => clearTimeout(timeout);
  }, [search, update]);

  return (
    <div className="crm-toolbar">
      <input
        type="text"
        className="crm-select"
        placeholder="Buscar na mensagem…"
        style={{ width: 220 }}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        aria-label="Buscar na mensagem"
      />

      <select
        className="crm-select"
        value={searchParams.get("workflowId") ?? ""}
        onChange={(e) => update({ workflowId: e.target.value || null })}
        aria-label="Automação"
      >
        <option value="">Todas as automações</option>
        {workflows.map((workflow) => (
          <option key={workflow.id} value={workflow.id}>
            {workflow.name}
          </option>
        ))}
      </select>

      <select
        className="crm-select"
        value={searchParams.get("level") ?? ""}
        onChange={(e) => update({ level: e.target.value || null })}
        aria-label="Nível"
      >
        <option value="">Todos os níveis</option>
        <option value="info">Info</option>
        <option value="aviso">Aviso</option>
        <option value="erro">Erro</option>
      </select>

      <input
        type="date"
        className="crm-select"
        value={searchParams.get("from") ?? ""}
        onChange={(e) => update({ from: e.target.value || null })}
        aria-label="De"
      />
      <input
        type="date"
        className="crm-select"
        value={searchParams.get("to") ?? ""}
        onChange={(e) => update({ to: e.target.value || null })}
        aria-label="Até"
      />
    </div>
  );
}
