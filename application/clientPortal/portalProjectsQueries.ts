import "server-only";

import { getDemoPortalProjectDetail, getDemoPortalProjects } from "@/lib/demo/mockClientPortal";
import { requirePortalAccess } from "@/services/clientPortal/portalAccessService";
import {
  getPortalProjectDetail,
  listPortalProjects,
} from "@/services/clientPortal/portalProjectService";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type { PortalAccess, PortalProjectDetail } from "@/types/clientPortal";
import type { Project } from "@/types/projects";

export async function getPortalProjectsPageData(): Promise<{
  access: PortalAccess;
  projects: Project[];
}> {
  const access = await requirePortalAccess();

  if (await isDemoModeActive()) {
    return { access, projects: getDemoPortalProjects() };
  }

  const supabase = await getSupabaseAuthClient();
  const projects = await listPortalProjects(supabase, access.clientId);
  return { access, projects };
}

export async function getPortalProjectDetailPageData(projectId: string): Promise<{
  access: PortalAccess;
  project: PortalProjectDetail | null;
}> {
  const access = await requirePortalAccess();

  if (await isDemoModeActive()) {
    return { access, project: getDemoPortalProjectDetail(projectId) };
  }

  const supabase = await getSupabaseAuthClient();
  const project = await getPortalProjectDetail(supabase, projectId, access.clientId);
  return { access, project };
}
