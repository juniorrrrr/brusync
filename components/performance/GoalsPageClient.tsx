"use client";

import { GoalCard } from "@/components/performance/GoalCard";
import { IconPlus } from "@/components/ui/icons";
import { useGoalEditor } from "@/contexts/performance/GoalEditorContext";
import type { GoalWithProgress } from "@/types/performance";

function NewGoalButton() {
  const { openCreate } = useGoalEditor();
  return (
    <button type="button" className="btn btn-accent" onClick={openCreate}>
      <IconPlus size={14} /> Nova meta
    </button>
  );
}

/** GoalEditorProvider/GoalEditorModal já estão montados no layout de
 * /performance (GoalCard usa useGoalEditor() em todas as 7 abas, não só
 * aqui), então este componente só precisa do botão e da listagem. */
export function GoalsPageClient({ goals }: { goals: GoalWithProgress[] }) {
  const active = goals.filter((goal) => goal.status === "ativa");
  const archived = goals.filter((goal) => goal.status === "arquivada");

  return (
    <>
      <div className="crm-card-head">
        <div className="crm-card-title">Metas ativas</div>
        <NewGoalButton />
      </div>
      <div className="crm-int-grid" style={{ marginTop: 12 }}>
        {active.map((goal) => (
          <GoalCard key={goal.id} goal={goal} />
        ))}
        {active.length === 0 && <p className="crm-card-sub">Nenhuma meta ativa ainda.</p>}
      </div>

      {archived.length > 0 && (
        <>
          <div className="crm-card-head" style={{ marginTop: 24 }}>
            <div className="crm-card-title">Metas arquivadas</div>
          </div>
          <div className="crm-int-grid" style={{ marginTop: 12 }}>
            {archived.map((goal) => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
          </div>
        </>
      )}
    </>
  );
}
