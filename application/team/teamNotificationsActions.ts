"use server";

import { requireCrmProfile } from "@/application/crm/authGuard";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { markTeamNotificationRead } from "@/services/team/teamService";

export async function markTeamNotificationReadAction(id: string): Promise<{ ok: boolean }> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return { ok: false };

  await markTeamNotificationRead(id);
  return { ok: true };
}
