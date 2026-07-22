import type { ReactNode } from "react";
import { ClientDrawer } from "@/components/crm/ClientDrawer";
import { LeadWorkspaceDrawer } from "@/components/crm/LeadWorkspaceDrawer";
import { CrmShell } from "@/components/layout/CrmShell";
import { ClientDrawerProvider } from "@/contexts/crm/ClientDrawerContext";
import { LeadDrawerProvider } from "@/contexts/crm/LeadDrawerContext";
import { getCurrentProfile, requireUser } from "@/services/auth/session";
import "@/styles/crm.css";

export default async function CrmAppLayout({ children }: { children: ReactNode }) {
  await requireUser();
  const profile = await getCurrentProfile();

  return (
    <LeadDrawerProvider>
      <ClientDrawerProvider>
        <CrmShell profile={profile}>{children}</CrmShell>
        <LeadWorkspaceDrawer />
        <ClientDrawer />
      </ClientDrawerProvider>
    </LeadDrawerProvider>
  );
}
