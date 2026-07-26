import { TeamMemberAvatar } from "@/components/team/TeamMemberAvatar";
import type { TeamMemberBreakdownRow } from "@/types/team";

export function TeamMemberBreakdownTable({
  title,
  rows,
  formatValue,
}: {
  title: string;
  rows: TeamMemberBreakdownRow[];
  formatValue: (value: number) => string;
}) {
  return (
    <div className="crm-card">
      <div className="crm-card-head">
        <div className="crm-card-title">{title}</div>
      </div>
      <div className="crm-card-pad">
        <div className="crm-mini-list">
          {rows.slice(0, 8).map((row) => (
            <div key={row.teamMemberId} className="crm-team-breakdown-row">
              <div className="crm-team-breakdown-name">
                <TeamMemberAvatar name={row.name} photoUrl={row.photoUrl} size={26} />
                <span>{row.name}</span>
              </div>
              <strong>{formatValue(row.value)}</strong>
            </div>
          ))}
          {rows.length === 0 && <p className="crm-card-sub">Sem dados no período.</p>}
        </div>
      </div>
    </div>
  );
}
