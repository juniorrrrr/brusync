"use client";

import { AUTOMATION_TRIGGER_LABEL } from "@/domain/automation/types";
import { useUpdateSearchParams } from "@/hooks/crm/useUpdateSearchParams";
import type { AutomationWorkflow } from "@/types/automation";

const TRIGGER_OPTIONS = Object.entries(AUTOMATION_TRIGGER_LABEL);

export function HistoryFilterBar({ workflows }: { workflows: AutomationWorkflow[] }) {
  const { update, searchParams } = useUpdateSearchParams();

  return (
    <div className="crm-toolbar">
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
        value={searchParams.get("triggerType") ?? ""}
        onChange={(e) => update({ triggerType: e.target.value || null })}
        aria-label="Trigger"
      >
        <option value="">Todos os triggers</option>
        {TRIGGER_OPTIONS.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      <select
        className="crm-select"
        value={searchParams.get("status") ?? ""}
        onChange={(e) => update({ status: e.target.value || null })}
        aria-label="Status"
      >
        <option value="">Todos os status</option>
        <option value="sucesso">Sucesso</option>
        <option value="condicao_nao_atendida">Condição não atendida</option>
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
