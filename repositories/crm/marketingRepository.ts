import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { type MaterialLeadRow, mapMaterialDownload } from "@/repositories/crm/mappers";
import type { MaterialDownload, SourceLeadAttribution } from "@/types/crm";

/** Reads from the pre-existing marketing capture tables (public.leads,
 * public.material_leads) — never writes to them. Those tables belong to the
 * public site's lead-capture flow; the CRM only reads their data for
 * attribution/history display. */

export async function getSourceLeadAttribution(
  supabase: SupabaseClient,
  sourceLeadId: string,
): Promise<SourceLeadAttribution | null> {
  const { data, error } = await supabase
    .from("leads")
    .select(
      "id, created_at, message, utm_source, utm_medium, utm_campaign, utm_term, utm_content, gclid, fbclid, msclkid, ttclid, landing_page, referer, device, os, browser, language, first_visit, last_visit",
    )
    .eq("id", sourceLeadId)
    .maybeSingle();

  if (error) throw new Error(`Falha ao carregar origem do lead: ${error.message}`);
  if (!data) return null;

  return {
    id: data.id,
    createdAt: data.created_at,
    message: data.message,
    utmSource: data.utm_source,
    utmMedium: data.utm_medium,
    utmCampaign: data.utm_campaign,
    utmTerm: data.utm_term,
    utmContent: data.utm_content,
    gclid: data.gclid,
    fbclid: data.fbclid,
    msclkid: data.msclkid,
    ttclid: data.ttclid,
    landingPage: data.landing_page,
    referer: data.referer,
    device: data.device,
    os: data.os,
    browser: data.browser,
    language: data.language,
    firstVisit: data.first_visit,
    lastVisit: data.last_visit,
  };
}

export async function listMaterialDownloadsByEmail(
  supabase: SupabaseClient,
  email: string,
): Promise<MaterialDownload[]> {
  const { data, error } = await supabase
    .from("material_leads")
    .select("id, material_slug, material_title, created_at")
    .eq("email", email)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Falha ao carregar downloads do lead: ${error.message}`);
  return ((data ?? []) as MaterialLeadRow[]).map(mapMaterialDownload);
}

export interface RecentMaterialDownload extends MaterialDownload {
  name: string;
  email: string;
}

export async function listRecentMaterialDownloads(
  supabase: SupabaseClient,
  limit = 6,
): Promise<RecentMaterialDownload[]> {
  const { data, error } = await supabase
    .from("material_leads")
    .select("id, material_slug, material_title, created_at, name, email")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Falha ao carregar últimos downloads: ${error.message}`);

  return ((data ?? []) as (MaterialLeadRow & { name: string; email: string })[]).map((row) => ({
    ...mapMaterialDownload(row),
    name: row.name,
    email: row.email,
  }));
}

export async function countMaterialDownloadsSince(
  supabase: SupabaseClient,
  sinceIso: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("material_leads")
    .select("*", { count: "exact", head: true })
    .gte("created_at", sinceIso);

  if (error) throw new Error(`Falha ao contar downloads: ${error.message}`);
  return count ?? 0;
}
