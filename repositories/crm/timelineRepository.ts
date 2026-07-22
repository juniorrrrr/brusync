import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { MaterialLeadRow } from "@/repositories/crm/mappers";
import {
  type LeadActivityRow,
  mapLeadActivity,
  mapMaterialDownload,
} from "@/repositories/crm/mappers";
import type { TimelineEntry } from "@/types/crm";

const ACTIVITY_SELECT = `
  id, crm_lead_id, type, title, body, metadata, due_at, done, created_by, created_at,
  author:profiles!crm_lead_activities_created_by_fkey (id, name, email)
`;

export interface TimelinePage {
  entries: TimelineEntry[];
  nextCursor: string | null;
}

function entryCreatedAt(entry: TimelineEntry): string {
  return entry.source === "activity" ? entry.activity.createdAt : entry.download.createdAt;
}

/** Merges crm_lead_activities (the immutable event log) with material_leads
 * downloads (matched by email — there's no FK between them) into a single
 * chronological, cursor-paginated feed. Fetches `limit + 1` from each source
 * so the merged pool is always large enough to slice a correct page and
 * detect whether more entries exist beyond it, even when one source is much
 * denser than the other in a given time window. */
export async function listTimelinePage(
  supabase: SupabaseClient,
  crmLeadId: string,
  email: string | null,
  options: { limit?: number; before?: string } = {},
): Promise<TimelinePage> {
  const limit = options.limit ?? 20;

  let activityQuery = supabase
    .from("crm_lead_activities")
    .select(ACTIVITY_SELECT)
    .eq("crm_lead_id", crmLeadId)
    .order("created_at", { ascending: false })
    .limit(limit + 1);
  if (options.before) activityQuery = activityQuery.lt("created_at", options.before);

  const downloadsPromise = email
    ? (async () => {
        let query = supabase
          .from("material_leads")
          .select("id, material_slug, material_title, created_at")
          .eq("email", email)
          .order("created_at", { ascending: false })
          .limit(limit + 1);
        if (options.before) query = query.lt("created_at", options.before);
        return query;
      })()
    : Promise.resolve({ data: [] as MaterialLeadRow[], error: null });

  const [activitiesRes, downloadsRes] = await Promise.all([activityQuery, downloadsPromise]);

  if (activitiesRes.error) {
    throw new Error(`Falha ao carregar timeline: ${activitiesRes.error.message}`);
  }
  if (downloadsRes.error) {
    throw new Error(`Falha ao carregar downloads da timeline: ${downloadsRes.error.message}`);
  }

  const activityEntries: TimelineEntry[] = (
    (activitiesRes.data ?? []) as unknown as LeadActivityRow[]
  ).map((row) => ({ source: "activity", activity: mapLeadActivity(row) }));
  const downloadEntries: TimelineEntry[] = ((downloadsRes.data ?? []) as MaterialLeadRow[]).map(
    (row) => ({
      source: "download",
      download: mapMaterialDownload(row),
    }),
  );

  const merged = [...activityEntries, ...downloadEntries].sort(
    (a, b) => new Date(entryCreatedAt(b)).getTime() - new Date(entryCreatedAt(a)).getTime(),
  );

  const page = merged.slice(0, limit);
  const hasMore = merged.length > limit;
  const nextCursor = hasMore && page.length > 0 ? entryCreatedAt(page[page.length - 1]) : null;

  return { entries: page, nextCursor };
}
