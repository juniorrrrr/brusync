import "server-only";

import { classifyMarketingOrigin } from "@/domain/marketing/originRules";
import { getLeadById } from "@/repositories/crm/leadsRepository";
import {
  getSourceLeadAttribution,
  listMaterialDownloadsByEmail,
} from "@/repositories/crm/marketingRepository";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type { LeadMarketingProfile } from "@/types/marketing";

/** Powers the Lead Workspace's "Marketing" tab — everything known about how
 * this specific lead was acquired, in one place. Superset of the Fase 3
 * sidebar attribution card (adds click IDs and first/last visit). */
export async function getLeadMarketingProfile(
  crmLeadId: string,
): Promise<LeadMarketingProfile | null> {
  const supabase = await getSupabaseAuthClient();
  const lead = await getLeadById(supabase, crmLeadId);
  if (!lead) return null;

  const [attribution, materialDownloads] = await Promise.all([
    lead.sourceLeadId
      ? getSourceLeadAttribution(supabase, lead.sourceLeadId)
      : Promise.resolve(null),
    lead.email ? listMaterialDownloadsByEmail(supabase, lead.email) : Promise.resolve([]),
  ]);

  return {
    hasAttribution: attribution !== null,
    utmSource: attribution?.utmSource ?? null,
    utmMedium: attribution?.utmMedium ?? null,
    utmCampaign: attribution?.utmCampaign ?? null,
    utmContent: attribution?.utmContent ?? null,
    utmTerm: attribution?.utmTerm ?? null,
    landingPage: attribution?.landingPage ?? null,
    referer: attribution?.referer ?? null,
    firstVisit: attribution?.firstVisit ?? null,
    lastVisit: attribution?.lastVisit ?? null,
    gclid: attribution?.gclid ?? null,
    fbclid: attribution?.fbclid ?? null,
    msclkid: attribution?.msclkid ?? null,
    ttclid: attribution?.ttclid ?? null,
    origin: classifyMarketingOrigin({
      utmSource: attribution?.utmSource ?? null,
      utmMedium: attribution?.utmMedium ?? null,
      referer: attribution?.referer ?? null,
      gclid: attribution?.gclid ?? null,
      fbclid: attribution?.fbclid ?? null,
      msclkid: attribution?.msclkid ?? null,
      ttclid: attribution?.ttclid ?? null,
      manualOrigin: lead.origin,
    }),
    materialDownloads: materialDownloads.map((download) => ({
      id: download.id,
      materialTitle: download.materialTitle,
      createdAt: download.createdAt,
    })),
  };
}
