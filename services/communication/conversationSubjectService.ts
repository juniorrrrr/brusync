import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { getLeadMarketingProfile } from "@/application/marketingAnalytics/leadMarketingProfile";
import { getLeadById } from "@/repositories/crm/leadsRepository";
import { listProjectsForClient } from "@/repositories/projects/projectsRepository";
import type { ConversationSubjectInfo } from "@/types/communication";

/** Everything the Central de Comunicação's right-hand panel shows about a
 * conversation's subject — reuses the exact same data sources the Lead
 * Workspace's Marketing tab and the Client's Projects section already use,
 * never duplicating the underlying attribution/project logic. */
export async function getConversationSubjectInfo(
  supabase: SupabaseClient,
  params: { crmLeadId: string | null; clientId: string | null },
): Promise<ConversationSubjectInfo> {
  const [lead, marketingProfile, projects] = await Promise.all([
    params.crmLeadId ? getLeadById(supabase, params.crmLeadId) : Promise.resolve(null),
    params.crmLeadId ? getLeadMarketingProfile(params.crmLeadId) : Promise.resolve(null),
    params.clientId ? listProjectsForClient(supabase, params.clientId) : Promise.resolve([]),
  ]);

  return {
    crmLeadCity: lead?.city ?? null,
    crmLeadOrigin: lead?.origin ?? null,
    stageLabel: lead?.stage.label ?? null,
    utmSource: marketingProfile?.utmSource ?? null,
    utmMedium: marketingProfile?.utmMedium ?? null,
    utmCampaign: marketingProfile?.utmCampaign ?? null,
    projects: projects.map((p) => ({ id: p.id, name: p.name, status: p.status })),
  };
}
