import type { Metadata } from "next";
import { getAutomationLogsPageData } from "@/application/automation/logsQueries";
import { fetchWorkflows } from "@/application/automation/workflowsActions";
import { AutomationLogRow } from "@/components/automation/AutomationLogRow";
import { LogsFilterBar } from "@/components/automation/LogsFilterBar";
import type { AutomationLogLevel } from "@/types/automation";

export const metadata: Metadata = {
  title: "Logs de Automações — Brusync OS",
  robots: { index: false, follow: false },
};

export default async function AutomacoesLogsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;

  const [workflows, page] = await Promise.all([
    fetchWorkflows(),
    getAutomationLogsPageData({
      workflowId: params.workflowId || undefined,
      level: (params.level as AutomationLogLevel | undefined) || undefined,
      search: params.q || undefined,
      createdFrom: params.from || undefined,
      createdTo: params.to || undefined,
      limit: 50,
    }),
  ]);

  return (
    <div>
      <p className="crm-page-sub" style={{ marginBottom: 12 }}>
        {page.total} {page.total === 1 ? "log registrado" : "logs registrados"}
      </p>

      <LogsFilterBar workflows={workflows} />

      <div className="crm-card crm-card-pad" style={{ marginTop: 16 }}>
        {page.logs.length === 0 ? (
          <p className="crm-card-sub">Nenhum log encontrado para os filtros selecionados.</p>
        ) : (
          page.logs.map((log) => <AutomationLogRow key={log.id} log={log} />)
        )}
      </div>
    </div>
  );
}
