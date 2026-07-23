import "server-only";

import { getDemoProjectsHealth } from "@/lib/demo/mockProjects";
import { getProjectsHealthStats } from "@/repositories/projects/projectsRepository";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type { ProjectsHealth } from "@/types/projects";

export async function getProjectsHealthData(): Promise<ProjectsHealth> {
  if (await isDemoModeActive()) return getDemoProjectsHealth();

  const supabase = await getSupabaseAuthClient();
  return getProjectsHealthStats(supabase);
}
