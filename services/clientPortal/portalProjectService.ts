import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { listMessagesForProject } from "@/repositories/clientPortal/portalMessagesRepository";
import { listProjectsForClient } from "@/repositories/projects/projectsRepository";
import { getProjectDetail } from "@/services/projects/projectLifecycleService";
import type { PortalProjectDetail } from "@/types/clientPortal";
import type { Project } from "@/types/projects";

/** Lists the portal user's own projects — RLS already scopes
 * crm_projects.select to their client_id, so this is the same repository
 * call the internal Cliente drawer uses, just executed with the portal
 * user's own cookie-bound session instead of a staff one. */
export async function listPortalProjects(
  supabase: SupabaseClient,
  clientId: string,
): Promise<Project[]> {
  return listProjectsForClient(supabase, clientId);
}

/** Project detail + its message thread, with a defense-in-depth ownership
 * check on top of RLS: even though the "Portal cliente lê crm_projects"
 * policy already guarantees a portal user can never fetch another client's
 * project, re-checking clientId here means a coding mistake elsewhere in
 * this module can never silently expose one client's project to another —
 * same belt-and-suspenders reasoning as requireCrmProfile() re-checking a
 * session that middleware already confirmed. */
export async function getPortalProjectDetail(
  supabase: SupabaseClient,
  projectId: string,
  clientId: string,
): Promise<PortalProjectDetail | null> {
  const project = await getProjectDetail(supabase, projectId);
  if (!project || project.clientId !== clientId) return null;

  const messages = await listMessagesForProject(supabase, projectId);
  return { ...project, messages };
}
