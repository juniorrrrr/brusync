import type { Metadata } from "next";
import { fetchTeamIndividualDashboardData } from "@/application/team/teamQueries";
import { TeamMemberFilterSelect } from "@/components/team/TeamMemberFilterSelect";
import { TeamMemberProfileClient } from "@/components/team/TeamMemberProfileClient";

export const metadata: Metadata = {
  title: "Individual — Equipe — Brusync OS",
};

export default async function EquipeIndividualPage({
  searchParams,
}: {
  searchParams: Promise<{ memberId?: string }>;
}) {
  const { memberId } = await searchParams;
  const data = await fetchTeamIndividualDashboardData(memberId);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <TeamMemberFilterSelect members={data.members} selectedMemberId={data.selectedMemberId} />
      {data.profile ? (
        <TeamMemberProfileClient profile={data.profile} />
      ) : (
        <div className="crm-card crm-card-pad">
          <p className="crm-card-sub">Nenhum colaborador cadastrado ainda.</p>
        </div>
      )}
    </div>
  );
}
