import "server-only";

import { requireCrmProfile } from "@/application/crm/authGuard";
import {
  getTeamCheckinsPageData,
  getTeamDashboardData,
  getTeamFeedbackPageData,
  getTeamGoalsPageData,
  getTeamIndividualDashboardData,
  getTeamMemberProfileData,
  getTeamMembersPageData,
  getTeamNotifications,
} from "@/services/team/teamService";
import type {
  TeamCheckinsPageData,
  TeamDashboardData,
  TeamFeedbackPageData,
  TeamGoalsPageData,
  TeamIndividualDashboardData,
  TeamMemberProfileData,
  TeamMembersPageData,
  TeamNotification,
} from "@/types/team";

/** Wrappers finos, um por aba de /equipe — mesmo padrão de
 * application/performance/performanceQueries.ts: guard de sessão em defesa de
 * profundidade + delega para services/team/teamService.ts, que já é 100%
 * ciente de Modo Demonstração. */

export async function fetchTeamDashboardData(): Promise<TeamDashboardData> {
  await requireCrmProfile();
  return getTeamDashboardData();
}

export async function fetchTeamMembersPageData(): Promise<TeamMembersPageData> {
  await requireCrmProfile();
  return getTeamMembersPageData();
}

export async function fetchTeamMemberProfileData(
  teamMemberId: string,
): Promise<TeamMemberProfileData | null> {
  await requireCrmProfile();
  return getTeamMemberProfileData(teamMemberId);
}

export async function fetchTeamIndividualDashboardData(
  teamMemberId?: string,
): Promise<TeamIndividualDashboardData> {
  await requireCrmProfile();
  return getTeamIndividualDashboardData(teamMemberId);
}

export async function fetchTeamGoalsPageData(): Promise<TeamGoalsPageData> {
  await requireCrmProfile();
  return getTeamGoalsPageData();
}

export async function fetchTeamFeedbackPageData(): Promise<TeamFeedbackPageData> {
  await requireCrmProfile();
  return getTeamFeedbackPageData();
}

export async function fetchTeamCheckinsPageData(): Promise<TeamCheckinsPageData> {
  await requireCrmProfile();
  return getTeamCheckinsPageData();
}

export async function fetchTeamNotifications(teamMemberId?: string): Promise<TeamNotification[]> {
  await requireCrmProfile();
  return getTeamNotifications(teamMemberId);
}
