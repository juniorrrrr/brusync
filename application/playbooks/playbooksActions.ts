"use server";

import { requireCrmProfile } from "@/application/crm/authGuard";
import { getPlaybookForLead } from "@/services/playbooks/playbooksService";
import type { PlaybookDetail } from "@/types/playbooks";

export async function fetchLeadPlaybookAction(leadId: string): Promise<PlaybookDetail | null> {
  await requireCrmProfile();
  return getPlaybookForLead(leadId);
}
