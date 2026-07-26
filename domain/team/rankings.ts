import type { TeamMember, TeamMemberMetrics, TeamRankingRow } from "@/types/team";

/** Score composto simples — 60% peso em receita normalizada, 40% em % de
 * metas atingidas — só para ordenar o ranking; nenhum valor é persistido, é
 * recalculado a cada carregamento do dashboard (mesmo espírito de
 * domain/performance/rankings.ts::buildTopTeams: nada novo é guardado). */
export function buildTeamRanking(
  members: TeamMember[],
  metricsById: Map<string, TeamMemberMetrics>,
  goalsAchievedById: Map<string, { achieved: number; total: number }>,
): TeamRankingRow[] {
  const rows = members.map((member) => {
    const metrics = metricsById.get(member.profileId);
    const goals = goalsAchievedById.get(member.id) ?? { achieved: 0, total: 0 };
    const goalRate = goals.total > 0 ? goals.achieved / goals.total : 0;
    return {
      teamMemberId: member.id,
      name: member.name ?? member.email ?? "—",
      photoUrl: member.photoUrl,
      revenue: metrics?.revenue ?? 0,
      goalsAchieved: goals.achieved,
      goalsTotal: goals.total,
      score: 0,
      _goalRate: goalRate,
    };
  });

  const maxRevenue = Math.max(...rows.map((r) => r.revenue), 1);

  return rows
    .map((row) => ({
      teamMemberId: row.teamMemberId,
      name: row.name,
      photoUrl: row.photoUrl,
      revenue: row.revenue,
      goalsAchieved: row.goalsAchieved,
      goalsTotal: row.goalsTotal,
      score: (row.revenue / maxRevenue) * 60 + row._goalRate * 40,
    }))
    .sort((a, b) => b.score - a.score);
}
