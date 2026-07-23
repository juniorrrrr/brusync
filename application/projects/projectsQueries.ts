import "server-only";

import { getDemoClientsPageData } from "@/lib/demo/mockCrm";
import { getDemoProjects } from "@/lib/demo/mockProjects";
import { listClients } from "@/repositories/crm/clientsRepository";
import {
  type ListProjectsOptions,
  listProjects,
  type ProjectsPage,
} from "@/repositories/projects/projectsRepository";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";

export async function getProjectsPageData(
  options: ListProjectsOptions = {},
): Promise<ProjectsPage> {
  if (await isDemoModeActive()) return getDemoProjects(options);

  const supabase = await getSupabaseAuthClient();
  return listProjects(supabase, options);
}

/** Options for the Lista de Projetos' "Cliente" filter select. */
export async function getClientFilterOptions(): Promise<{ id: string; company: string }[]> {
  if (await isDemoModeActive()) {
    return getDemoClientsPageData({}).clients.map((c) => ({ id: c.id, company: c.company }));
  }

  const supabase = await getSupabaseAuthClient();
  const clients = await listClients(supabase);
  return clients.map((c) => ({ id: c.id, company: c.company }));
}
