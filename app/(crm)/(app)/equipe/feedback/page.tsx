import type { Metadata } from "next";
import { fetchTeamFeedbackPageData } from "@/application/team/teamQueries";
import { TeamFeedbackList } from "@/components/team/TeamFeedbackList";
import { TeamFeedbackNewButton } from "@/components/team/TeamFeedbackNewButton";

export const metadata: Metadata = {
  title: "Feedback — Equipe — Brusync OS",
};

export default async function EquipeFeedbackPage() {
  const { feedbacks } = await fetchTeamFeedbackPageData();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="crm-page-head" style={{ marginBottom: 0 }}>
        <div>
          <div className="crm-card-title">Feedback interno</div>
          <p className="crm-card-sub">{feedbacks.length} registro(s)</p>
        </div>
        <TeamFeedbackNewButton />
      </div>

      <div className="crm-card crm-card-pad">
        <TeamFeedbackList feedbacks={feedbacks} showRecipient />
      </div>
    </div>
  );
}
