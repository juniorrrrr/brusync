"use server";

import { requireCrmProfile } from "@/application/crm/authGuard";
import { getLeadById } from "@/repositories/crm/leadsRepository";
import { listTimelinePage, type TimelinePage } from "@/repositories/crm/timelineRepository";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";

/** Lazily fetched by the Timeline tab the first time it's opened, and again
 * on scroll for subsequent pages — the Lead Workspace never loads the full
 * timeline up front. */
export async function fetchTimelinePage(crmLeadId: string, cursor?: string): Promise<TimelinePage> {
  await requireCrmProfile();
  const supabase = await getSupabaseAuthClient();
  const lead = await getLeadById(supabase, crmLeadId);
  return listTimelinePage(supabase, crmLeadId, lead?.email ?? null, { before: cursor });
}
