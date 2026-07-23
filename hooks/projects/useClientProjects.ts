"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchProjectsForClient } from "@/application/projects/projectsActions";
import type { Project } from "@/types/projects";

/** Client-side data source for the Cliente drawer's "Projetos" section —
 * reloaded after the Project Drawer closes with a change, same
 * reload-on-demand shape as useWorkflowsList / useLeadAgenda. */
export function useClientProjects(clientId: string) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    setLoading(true);
    fetchProjectsForClient(clientId)
      .then(setProjects)
      .finally(() => setLoading(false));
  }, [clientId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { projects, loading, reload };
}
