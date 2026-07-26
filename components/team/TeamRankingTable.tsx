import Link from "next/link";
import { TeamMemberAvatar } from "@/components/team/TeamMemberAvatar";
import type { TeamRankingRow } from "@/types/team";

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function TeamRankingTable({ rows }: { rows: TeamRankingRow[] }) {
  return (
    <div className="crm-card">
      <div className="crm-card-head">
        <div className="crm-card-title">Ranking da equipe</div>
      </div>
      <div className="crm-card-pad">
        <div className="crm-team-ranking-list">
          {rows.map((row, index) => (
            <Link
              key={row.teamMemberId}
              href={`/equipe/colaboradores/${row.teamMemberId}`}
              className="crm-team-ranking-row"
            >
              <span className="crm-team-ranking-position">{index + 1}º</span>
              <TeamMemberAvatar name={row.name} photoUrl={row.photoUrl} size={32} />
              <div className="crm-team-ranking-info">
                <div className="crm-team-card-name">{row.name}</div>
                <div className="crm-card-sub">
                  {row.goalsAchieved}/{row.goalsTotal} metas atingidas
                </div>
              </div>
              <strong>{formatCurrency(row.revenue)}</strong>
            </Link>
          ))}
          {rows.length === 0 && (
            <p className="crm-card-sub">Nenhum colaborador cadastrado ainda.</p>
          )}
        </div>
      </div>
    </div>
  );
}
