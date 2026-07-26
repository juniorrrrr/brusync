import type {
  TeamDashboardIndicators,
  TeamMember,
  TeamMemberBreakdownRow,
  TeamMemberMetrics,
} from "@/types/team";

function toBreakdown(
  members: TeamMember[],
  metricsById: Map<string, TeamMemberMetrics>,
  pick: (metrics: TeamMemberMetrics) => number,
): TeamMemberBreakdownRow[] {
  return members
    .map((member) => {
      const metrics = metricsById.get(member.profileId);
      return {
        teamMemberId: member.id,
        name: member.name ?? member.email ?? "—",
        photoUrl: member.photoUrl,
        value: metrics ? pick(metrics) : 0,
      };
    })
    .sort((a, b) => b.value - a.value);
}

export function buildMemberBreakdowns(
  members: TeamMember[],
  metricsById: Map<string, TeamMemberMetrics>,
) {
  return {
    leadsByMember: toBreakdown(members, metricsById, (m) => m.leadsCount),
    clientsByMember: toBreakdown(members, metricsById, (m) => m.clientsCount),
    projectsByMember: toBreakdown(members, metricsById, (m) => m.projectsCount),
    revenueByMember: toBreakdown(members, metricsById, (m) => m.revenue),
    conversionByMember: toBreakdown(members, metricsById, (m) => m.conversionRate ?? 0),
  };
}

export function buildDashboardIndicators(params: {
  members: TeamMember[];
  goalPercents: (number | null)[];
  goalsAchieved: number;
  goalsAtRisk: number;
  averageResponseMinutes: number | null;
  averageTimeToFirstContactDays: number | null;
}): TeamDashboardIndicators {
  const withScore = params.goalPercents.filter((p): p is number => p !== null);
  const averageProductivity =
    withScore.length > 0
      ? withScore.reduce((sum, p) => sum + Math.min(p, 100), 0) / withScore.length
      : null;

  return {
    activeMembers: params.members.filter((m) => m.status === "ativo").length,
    goalsAchieved: params.goalsAchieved,
    goalsAtRisk: params.goalsAtRisk,
    averageProductivity,
    averageResponseMinutes: params.averageResponseMinutes,
    averageTimeToFirstContactDays: params.averageTimeToFirstContactDays,
  };
}
