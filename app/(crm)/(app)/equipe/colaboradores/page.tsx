import type { Metadata } from "next";
import { fetchTeamMembersPageData } from "@/application/team/teamQueries";
import { TeamMemberCard } from "@/components/team/TeamMemberCard";

export const metadata: Metadata = {
  title: "Colaboradores — Equipe — Brusync OS",
};

export default async function EquipeColaboradoresPage() {
  const { members } = await fetchTeamMembersPageData();

  return (
    <div
      className="crm-proc-category-grid"
      style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}
    >
      {members.map((member) => (
        <TeamMemberCard key={member.id} member={member} />
      ))}
      {members.length === 0 && (
        <div className="crm-card crm-card-pad">
          <p className="crm-card-sub">Nenhum colaborador cadastrado ainda.</p>
        </div>
      )}
    </div>
  );
}
