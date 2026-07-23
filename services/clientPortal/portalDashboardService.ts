import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { buildPortalDashboardData } from "@/domain/clientPortal/dashboard";
import { listMessagesForProjects } from "@/repositories/clientPortal/portalMessagesRepository";
import { listProjectsForClient } from "@/repositories/projects/projectsRepository";
import { getProjectDetailsForClient } from "@/services/projects/projectLifecycleService";
import type { PortalDashboardData, PortalProjectDetail } from "@/types/clientPortal";

/** Reuses the exact same read path the internal CRM's Cliente drawer already
 * uses for "Projetos do cliente" — RLS (not a second query) is what keeps a
 * portal user scoped to only their own client_id — plus one batched fetch
 * for every project's message thread, since "Últimas movimentações" needs
 * those alongside the Fase 12 phase/task/file events. */
export async function getPortalDashboardData(
  supabase: SupabaseClient,
  clientId: string,
): Promise<PortalDashboardData> {
  const projects = await listProjectsForClient(supabase, clientId);
  const projectIds = projects.map((p) => p.id);
  const [details, messagesByProject] = await Promise.all([
    getProjectDetailsForClient(supabase, projectIds),
    listMessagesForProjects(supabase, projectIds),
  ]);

  const portalDetails: PortalProjectDetail[] = details.map((detail) => ({
    ...detail,
    messages: messagesByProject[detail.id] ?? [],
  }));

  return buildPortalDashboardData(portalDetails);
}
