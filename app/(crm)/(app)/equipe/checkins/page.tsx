import type { Metadata } from "next";
import { fetchTeamCheckinsPageData } from "@/application/team/teamQueries";
import { TeamCheckinList } from "@/components/team/TeamCheckinList";
import { TeamCheckinNewButton } from "@/components/team/TeamCheckinNewButton";

export const metadata: Metadata = {
  title: "Check-ins — Equipe — Brusync OS",
};

export default async function EquipeCheckinsPage() {
  const { checkins } = await fetchTeamCheckinsPageData();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="crm-page-head" style={{ marginBottom: 0 }}>
        <div>
          <div className="crm-card-title">Check-ins</div>
          <p className="crm-card-sub">{checkins.length} registro(s)</p>
        </div>
        <TeamCheckinNewButton />
      </div>

      <div className="crm-card crm-card-pad">
        <TeamCheckinList checkins={checkins} showMemberName />
      </div>
    </div>
  );
}
