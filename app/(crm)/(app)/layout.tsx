import type { ReactNode } from "react";
import { fetchChannels } from "@/application/communication/communicationLookupsActions";
import { fetchOwnerOptions } from "@/application/crm/leadsActions";
import {
  fetchFinancialAccounts,
  fetchFinancialCategories,
} from "@/application/financial/financialLookupsActions";
import { CommunicationGlobalDialogs } from "@/components/communication/CommunicationGlobalDialogs";
import { ClientDrawer } from "@/components/crm/ClientDrawer";
import { LeadWorkspaceDrawer } from "@/components/crm/LeadWorkspaceDrawer";
import { FinancialGlobalDialogs } from "@/components/financial/FinancialGlobalDialogs";
import { CrmShell } from "@/components/layout/CrmShell";
import { ProjectDrawer } from "@/components/projects/ProjectDrawer";
import { ProjectGlobalDialogs } from "@/components/projects/ProjectGlobalDialogs";
import { ConversationDialogProvider } from "@/contexts/communication/ConversationDialogContext";
import { ClientDrawerProvider } from "@/contexts/crm/ClientDrawerContext";
import { LeadDrawerProvider } from "@/contexts/crm/LeadDrawerContext";
import { FinancialEditorProvider } from "@/contexts/financial/FinancialEditorContext";
import { ProjectDrawerProvider } from "@/contexts/projects/ProjectDrawerContext";
import { ProjectEditorProvider } from "@/contexts/projects/ProjectEditorContext";
import { getCurrentProfile, requireUser } from "@/services/auth/session";
import "@/styles/crm.css";

export default async function CrmAppLayout({ children }: { children: ReactNode }) {
  await requireUser();
  const profile = await getCurrentProfile();
  const owners = await fetchOwnerOptions();
  const [financialAccounts, financialCategories, channels] = await Promise.all([
    fetchFinancialAccounts(),
    fetchFinancialCategories(),
    fetchChannels(),
  ]);

  return (
    <LeadDrawerProvider>
      <ClientDrawerProvider>
        <ProjectDrawerProvider>
          <ProjectEditorProvider>
            <FinancialEditorProvider>
              <ConversationDialogProvider>
                <CrmShell profile={profile}>{children}</CrmShell>
                <LeadWorkspaceDrawer />
                <ClientDrawer />
                <ProjectDrawer owners={owners} />
                <ProjectGlobalDialogs owners={owners} />
                <FinancialGlobalDialogs
                  accounts={financialAccounts}
                  categories={financialCategories}
                />
                <CommunicationGlobalDialogs channels={channels} owners={owners} />
              </ConversationDialogProvider>
            </FinancialEditorProvider>
          </ProjectEditorProvider>
        </ProjectDrawerProvider>
      </ClientDrawerProvider>
    </LeadDrawerProvider>
  );
}
