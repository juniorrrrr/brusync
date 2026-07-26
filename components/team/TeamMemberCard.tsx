import Link from "next/link";
import { TeamMemberAvatar } from "@/components/team/TeamMemberAvatar";
import { MEMBER_STATUS_BADGE, MEMBER_STATUS_LABEL } from "@/domain/team/statusMeta";
import type { TeamMember } from "@/types/team";

export function TeamMemberCard({ member }: { member: TeamMember }) {
  return (
    <Link
      href={`/equipe/colaboradores/${member.id}`}
      className="crm-card crm-card-pad crm-team-card"
    >
      <div className="crm-team-card-top">
        <TeamMemberAvatar name={member.name} photoUrl={member.photoUrl} size={44} />
        <div>
          <div className="crm-team-card-name">{member.name ?? member.email ?? "—"}</div>
          <div className="crm-card-sub">{member.roleName ?? "Sem cargo"}</div>
        </div>
      </div>

      <div className="crm-proc-card-meta">
        <span>{member.department ?? "Sem departamento"}</span>
        {member.entryDate && (
          <span>Desde {member.entryDate.slice(0, 10).split("-").reverse().join("/")}</span>
        )}
      </div>

      <div className="crm-team-card-bottom">
        <span className={`crm-badge ${MEMBER_STATUS_BADGE[member.status]}`}>
          {MEMBER_STATUS_LABEL[member.status]}
        </span>
        {member.supervisorName && (
          <span className="crm-card-sub">Supervisor: {member.supervisorName}</span>
        )}
      </div>
    </Link>
  );
}
