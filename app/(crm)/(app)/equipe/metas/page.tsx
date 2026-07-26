import type { Metadata } from "next";
import { fetchTeamGoalsPageData } from "@/application/team/teamQueries";
import { TeamGoalCard } from "@/components/team/TeamGoalCard";
import { TeamGoalsNewButton } from "@/components/team/TeamGoalsNewButton";

export const metadata: Metadata = {
  title: "Metas — Equipe — Brusync OS",
};

export default async function EquipeMetasPage() {
  const { goals } = await fetchTeamGoalsPageData();
  const active = goals.filter((g) => g.status === "ativa");
  const archived = goals.filter((g) => g.status === "arquivada");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="crm-page-head" style={{ marginBottom: 0 }}>
        <div>
          <div className="crm-card-title">Metas ativas</div>
          <p className="crm-card-sub">{active.length} meta(s)</p>
        </div>
        <TeamGoalsNewButton />
      </div>

      <div className="crm-int-grid">
        {active.map((goal) => (
          <TeamGoalCard key={goal.id} goal={goal} showMemberName />
        ))}
        {active.length === 0 && (
          <div className="crm-card crm-card-pad">
            <p className="crm-card-sub">Nenhuma meta ativa.</p>
          </div>
        )}
      </div>

      {archived.length > 0 && (
        <>
          <div className="crm-card-title">Metas arquivadas</div>
          <div className="crm-int-grid">
            {archived.map((goal) => (
              <TeamGoalCard key={goal.id} goal={goal} showMemberName />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
