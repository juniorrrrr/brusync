import type { Metadata } from "next";
import Link from "next/link";
import { fetchProcessDashboardData } from "@/application/processes/processesQueries";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { HistoryTimeline } from "@/components/processes/HistoryTimeline";
import { ProcessCard } from "@/components/processes/ProcessCard";
import { ProcessCategoryIcon } from "@/components/processes/ProcessCategoryIcon";
import { IconChart, IconCheckCircle, IconClock, IconFolder } from "@/components/ui/icons";
import { PROCESS_STATUS_LABEL } from "@/domain/processes/statusMeta";

export const metadata: Metadata = {
  title: "Dashboard — Processos — Brusync OS",
};

export default async function ProcessesDashboardPage() {
  const data = await fetchProcessDashboardData();

  return (
    <div>
      <div className="crm-kpi-grid">
        <KpiCard label="Processos" value={data.totalProcesses} icon={IconFolder} />
        <KpiCard label="Ativos" value={data.activeProcesses} icon={IconClock} />
        <KpiCard label="Concluídos" value={data.completedProcesses} icon={IconCheckCircle} />
        <KpiCard
          label="% concluído (geral)"
          value={`${data.overallProgressPercent}%`}
          icon={IconChart}
        />
      </div>

      <div className="crm-int-grid" style={{ marginTop: 20 }}>
        <div className="crm-card crm-card-pad">
          <div className="crm-card-title">Por categoria</div>
          <div className="crm-mini-list" style={{ marginTop: 8 }}>
            {data.byCategory.map((category) => (
              <div key={category.categoryId} className="crm-mini-row">
                <ProcessCategoryIcon
                  icon={category.categoryIcon}
                  color={category.categoryColor}
                  size={16}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="crm-mini-title">{category.categoryName}</div>
                </div>
                <span className="crm-mini-trail">
                  {category.completedCount}/{category.processCount}
                </span>
              </div>
            ))}
            {data.byCategory.length === 0 && <p className="crm-card-sub">Nenhum processo ainda.</p>}
          </div>
        </div>

        <div className="crm-card crm-card-pad">
          <div className="crm-card-title">Por responsável</div>
          <div className="crm-mini-list" style={{ marginTop: 8 }}>
            {data.byOwner.map((owner) => (
              <div key={owner.ownerId ?? "sem-responsavel"} className="crm-mini-row">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="crm-mini-title">{owner.ownerName ?? "Sem responsável"}</div>
                  <div className="crm-card-sub">
                    {owner.activeCount} ativos · {owner.completedCount} concluídos
                  </div>
                </div>
                <span className="crm-mini-trail">{owner.progressPercent}%</span>
              </div>
            ))}
            {data.byOwner.length === 0 && <p className="crm-card-sub">Nenhum processo ainda.</p>}
          </div>
        </div>

        <div className="crm-card crm-card-pad">
          <div className="crm-card-title">Por status</div>
          <div className="crm-mini-list" style={{ marginTop: 8 }}>
            {data.byStatus.map((entry) => (
              <div key={entry.status} className="crm-mini-row">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="crm-mini-title">{PROCESS_STATUS_LABEL[entry.status]}</div>
                </div>
                <span className="crm-mini-trail">{entry.count}</span>
              </div>
            ))}
            {data.byStatus.length === 0 && <p className="crm-card-sub">Nenhum processo ainda.</p>}
          </div>
        </div>

        <div className="crm-card crm-card-pad">
          <div className="crm-card-title">Aprovações pendentes</div>
          <div className="crm-mini-list" style={{ marginTop: 8 }}>
            {data.pendingApprovals.map((approval) => (
              <Link
                key={approval.id}
                href={`/processos/${approval.processId}`}
                className="crm-mini-row"
              >
                <span className="crm-mini-ico">•</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="crm-mini-title">
                    {approval.stepName ? `Etapa: ${approval.stepName}` : "Aprovação de processo"}
                  </div>
                  <div className="crm-card-sub">
                    Solicitado por {approval.requestedByName ?? "—"}
                  </div>
                </div>
              </Link>
            ))}
            {data.pendingApprovals.length === 0 && (
              <p className="crm-card-sub">Nenhuma aprovação pendente.</p>
            )}
          </div>
        </div>
      </div>

      <div className="crm-card-head" style={{ marginTop: 20 }}>
        <div className="crm-card-title">Processos recentes</div>
        <Link href="/processos/lista" className="btn btn-outline">
          Ver todos
        </Link>
      </div>
      <div className="crm-int-grid" style={{ marginTop: 12 }}>
        {data.recentProcesses.map((process) => (
          <ProcessCard key={process.id} process={process} />
        ))}
        {data.recentProcesses.length === 0 && (
          <p className="crm-card-sub">Nenhum processo criado ainda.</p>
        )}
      </div>

      <div className="crm-card crm-card-pad" style={{ marginTop: 20 }}>
        <div className="crm-card-title">Atividade recente</div>
        <div style={{ marginTop: 8 }}>
          <HistoryTimeline entries={data.recentHistory} showProcessName />
        </div>
      </div>
    </div>
  );
}
