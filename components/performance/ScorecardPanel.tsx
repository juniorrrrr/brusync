import { KpiCard } from "@/components/dashboard/KpiCard";
import { GoalCard } from "@/components/performance/GoalCard";
import { IconChart, IconCheckCircle, IconTarget, IconWallet } from "@/components/ui/icons";
import type { Scorecard } from "@/types/performance";

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function ScorecardPanel({ scorecard }: { scorecard: Scorecard }) {
  return (
    <div className="crm-card">
      <div className="crm-card-head">
        <div className="crm-card-title">{scorecard.scopeLabel}</div>
      </div>
      <div className="crm-card-pad">
        <div className="crm-kpi-grid">
          <KpiCard label="Metas atingidas" value={scorecard.goalsAchieved} icon={IconCheckCircle} />
          <KpiCard label="Metas pendentes" value={scorecard.goalsPending} icon={IconTarget} />
          <KpiCard
            label="% concluído"
            value={
              scorecard.percentComplete !== null ? `${scorecard.percentComplete.toFixed(0)}%` : "—"
            }
            icon={IconChart}
          />
          <KpiCard
            label="Receita gerada"
            value={formatCurrency(scorecard.revenueGenerated)}
            icon={IconWallet}
          />
        </div>

        <div className="crm-int-grid" style={{ marginTop: 16 }}>
          {scorecard.goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
          {scorecard.goals.length === 0 && (
            <p className="crm-card-sub">Nenhuma meta ativa para este escopo.</p>
          )}
        </div>
      </div>
    </div>
  );
}
