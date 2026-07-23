import type { Metadata } from "next";
import { getAutomationHistoryPageData } from "@/application/automation/historyQueries";
import { fetchWorkflows } from "@/application/automation/workflowsActions";
import { ExecutionRow } from "@/components/automation/ExecutionRow";
import { HistoryFilterBar } from "@/components/automation/HistoryFilterBar";
import type { AutomationExecutionStatus, AutomationTriggerType } from "@/types/automation";

export const metadata: Metadata = {
  title: "Histórico de Automações — Brusync OS",
  robots: { index: false, follow: false },
};

export default async function AutomacoesHistoricoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;

  const [workflows, page] = await Promise.all([
    fetchWorkflows(),
    getAutomationHistoryPageData({
      workflowId: params.workflowId || undefined,
      triggerType: (params.triggerType as AutomationTriggerType | undefined) || undefined,
      status: (params.status as AutomationExecutionStatus | undefined) || undefined,
      createdFrom: params.from || undefined,
      createdTo: params.to || undefined,
      limit: 50,
    }),
  ]);

  return (
    <div>
      <p className="crm-page-sub" style={{ marginBottom: 12 }}>
        {page.total} {page.total === 1 ? "execução registrada" : "execuções registradas"}
      </p>

      <HistoryFilterBar workflows={workflows} />

      <div className="crm-card crm-card-pad" style={{ marginTop: 16 }}>
        {page.executions.length === 0 ? (
          <p className="crm-card-sub">Nenhuma execução encontrada para os filtros selecionados.</p>
        ) : (
          page.executions.map((execution) => (
            <ExecutionRow key={execution.id} execution={execution} />
          ))
        )}
      </div>
    </div>
  );
}
