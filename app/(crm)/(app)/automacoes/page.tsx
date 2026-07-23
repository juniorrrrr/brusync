import type { Metadata } from "next";
import Link from "next/link";
import { getAutomationHealthData } from "@/application/automation/automationHealthQueries";
import { getAutomationHistoryPageData } from "@/application/automation/historyQueries";
import { ExecutionRow } from "@/components/automation/ExecutionRow";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { IconBell, IconBolt, IconCheckCircle, IconClock, IconTarget } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Automações — Brusync OS",
  robots: { index: false, follow: false },
};

export default async function AutomacoesPage() {
  const [health, { executions }] = await Promise.all([
    getAutomationHealthData(),
    getAutomationHistoryPageData({ limit: 6 }),
  ]);

  return (
    <div>
      <div className="crm-kpi-grid">
        <KpiCard label="Automações ativas" value={String(health.activeWorkflows)} icon={IconBolt} />
        <KpiCard
          label="Execuções hoje"
          value={String(health.executionsToday)}
          icon={IconCheckCircle}
        />
        <KpiCard
          label="Taxa de sucesso"
          value={health.successRate !== null ? `${health.successRate.toFixed(1)}%` : "—"}
          icon={IconTarget}
        />
        <KpiCard
          label="Tempo médio"
          value={health.averageDurationMs !== null ? `${health.averageDurationMs} ms` : "—"}
          icon={IconClock}
        />
        <KpiCard label="Falhas" value={String(health.failuresToday)} icon={IconBell} />
      </div>

      <div className="crm-card crm-card-pad" style={{ marginTop: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="crm-card-title">Execuções recentes</div>
          <Link href="/automacoes/historico" className="crm-au-action-btn">
            Ver histórico completo →
          </Link>
        </div>
        <div style={{ marginTop: 8 }}>
          {executions.length === 0 ? (
            <p className="crm-card-sub">Nenhuma execução registrada ainda.</p>
          ) : (
            executions.map((execution) => <ExecutionRow key={execution.id} execution={execution} />)
          )}
        </div>
      </div>
    </div>
  );
}
