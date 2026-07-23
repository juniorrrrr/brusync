"use client";

import { useRouter } from "next/navigation";
import { ProjectEditorDialog } from "@/components/projects/ProjectEditorDialog";
import { useClientDrawer } from "@/contexts/crm/ClientDrawerContext";
import { useProjectDrawer } from "@/contexts/projects/ProjectDrawerContext";
import type { OwnerRef } from "@/types/crm";

/** Mounted once at the CRM shell — the "Novo projeto"/"Editar projeto" form
 * can be triggered from the /projetos list or from the Cliente drawer's
 * Projetos section, and either way, saving successfully opens the
 * project's own drawer and refreshes whichever list is currently showing.
 * Closes the Cliente drawer first when opening one from there — two
 * overlay drawers stacked at once looks broken, not layered. */
export function ProjectGlobalDialogs({ owners }: { owners: OwnerRef[] }) {
  const router = useRouter();
  const { openProject, refresh } = useProjectDrawer();
  const { close: closeClientDrawer } = useClientDrawer();

  function handleSaved(projectId?: string) {
    router.refresh();
    if (projectId) {
      closeClientDrawer();
      openProject(projectId);
    } else {
      refresh();
    }
  }

  return <ProjectEditorDialog owners={owners} onSaved={handleSaved} />;
}
