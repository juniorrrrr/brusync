import type { ReactNode } from "react";
import { fetchOwnerOptions } from "@/application/crm/leadsActions";
import { ClientDrawer } from "@/components/crm/ClientDrawer";
import { LeadWorkspaceDrawer } from "@/components/crm/LeadWorkspaceDrawer";
import { CrmShell } from "@/components/layout/CrmShell";
import { ProjectDrawer } from "@/components/projects/ProjectDrawer";
import { ProjectGlobalDialogs } from "@/components/projects/ProjectGlobalDialogs";
import { ClientDrawerProvider } from "@/contexts/crm/ClientDrawerContext";
import { LeadDrawerProvider } from "@/contexts/crm/LeadDrawerContext";
import { ProjectDrawerProvider } from "@/contexts/projects/ProjectDrawerContext";
import { ProjectEditorProvider } from "@/contexts/projects/ProjectEditorContext";
import { getCurrentProfile, requireUser } from "@/services/auth/session";
import "@/styles/crm.css";

export default async function CrmAppLayout({ children }: { children: ReactNode }) {
  await requireUser();
  const profile = await getCurrentProfile();
  const owners = await fetchOwnerOptions();

  return (
    <LeadDrawerProvider>
      <ClientDrawerProvider>
        <ProjectDrawerProvider>
          <ProjectEditorProvider>
            <CrmShell profile={profile}>{children}</CrmShell>
            <LeadWorkspaceDrawer />
            <ClientDrawer />
            <ProjectDrawer owners={owners} />
            <ProjectGlobalDialogs owners={owners} />
          </ProjectEditorProvider>
        </ProjectDrawerProvider>
      </ClientDrawerProvider>
    </LeadDrawerProvider>
  );
}
