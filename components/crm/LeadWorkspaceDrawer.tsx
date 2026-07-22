"use client";

import { WorkspaceHeader } from "@/components/crm/leadWorkspace/WorkspaceHeader";
import { WorkspaceSidebar } from "@/components/crm/leadWorkspace/WorkspaceSidebar";
import { WorkspaceTabs } from "@/components/crm/leadWorkspace/WorkspaceTabs";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { useLeadDrawer } from "@/contexts/crm/LeadDrawerContext";

export function LeadWorkspaceDrawer() {
  const { leadId, data, loading, error, close, refresh } = useLeadDrawer();
  const open = leadId !== null;

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        if (!next) close();
      }}
      direction="right"
    >
      <DrawerContent className="crm-workspace-content">
        {loading && <div className="crm-drawer-loading">Carregando lead…</div>}
        {!loading && error && <div className="crm-drawer-empty">{error}</div>}
        {!loading && data && (
          <>
            <WorkspaceHeader
              lead={data.lead}
              owners={data.owners}
              stages={data.stages}
              onChanged={refresh}
              onClose={close}
            />
            <div className="crm-ws-body">
              <div className="crm-ws-main">
                <WorkspaceTabs crmLeadId={data.lead.id} refreshToken={data.lead.updatedAt} />
              </div>
              <div className="crm-ws-side">
                <WorkspaceSidebar
                  lead={data.lead}
                  sourceAttribution={data.sourceAttribution}
                  materialDownloads={data.materialDownloads}
                />
              </div>
            </div>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
