import type { Metadata } from "next";
import { fetchPerformanceTeamData } from "@/application/performance/performanceQueries";
import { ScorecardPanel } from "@/components/performance/ScorecardPanel";

export const metadata: Metadata = {
  title: "Equipe — Performance — Brusync OS",
};

export default async function PerformanceEquipePage() {
  const data = await fetchPerformanceTeamData();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {data.scorecards.map((scorecard) => (
        <ScorecardPanel key={scorecard.scopeRef} scorecard={scorecard} />
      ))}
      {data.scorecards.length === 0 && (
        <div className="crm-card crm-card-pad">
          <p className="crm-card-sub">Nenhuma meta de equipe cadastrada ainda.</p>
        </div>
      )}
    </div>
  );
}
