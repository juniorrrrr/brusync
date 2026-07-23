"use client";

import { ProjectPortalMessagesTab } from "@/components/clientPortal/ProjectPortalMessagesTab";
import { ProjectChecklistTab } from "@/components/projects/ProjectChecklistTab";
import { ProjectFilesTab } from "@/components/projects/ProjectFilesTab";
import { ProjectPhasesTab } from "@/components/projects/ProjectPhasesTab";
import { ProjectScheduleTab } from "@/components/projects/ProjectScheduleTab";
import { ProjectSummarySidebar } from "@/components/projects/ProjectSummarySidebar";
import { ProjectTaskDialog } from "@/components/projects/ProjectTaskDialog";
import { ProjectTimelineTab } from "@/components/projects/ProjectTimelineTab";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { IconX } from "@/components/ui/icons";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProjectDrawer } from "@/contexts/projects/ProjectDrawerContext";
import { ProjectTaskDialogProvider } from "@/contexts/projects/ProjectTaskDialogContext";
import { initials } from "@/domain/crm/format";
import { PROJECT_STATUS_BADGE, PROJECT_STATUS_LABEL } from "@/domain/projects/types";
import type { OwnerRef } from "@/types/crm";

export function ProjectDrawer({ owners }: { owners: OwnerRef[] }) {
  const { projectId, data, loading, error, close, refresh } = useProjectDrawer();
  const open = projectId !== null;

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        if (!next) close();
      }}
      direction="right"
    >
      <DrawerContent className="crm-workspace-content">
        {loading && <div className="crm-drawer-loading">Carregando projeto…</div>}
        {!loading && error && <div className="crm-drawer-empty">{error}</div>}
        {!loading && data && (
          <ProjectTaskDialogProvider>
            <div className="crm-ws-header">
              <div className="crm-ws-header-top">
                <div className="crm-ws-identity">
                  <div className="crm-lead-avatar">{initials(data.name)}</div>
                  <div style={{ minWidth: 0 }}>
                    <div className="crm-ws-name-row">
                      <span className="crm-ws-name">{data.name}</span>
                      <span className={`crm-badge ${PROJECT_STATUS_BADGE[data.status]}`}>
                        {PROJECT_STATUS_LABEL[data.status]}
                      </span>
                    </div>
                    <div className="crm-ws-subline">
                      <span>{data.clientCompany}</span>
                    </div>
                  </div>
                </div>
                <button type="button" className="crm-ws-close" onClick={close} aria-label="Fechar">
                  <IconX size={18} />
                </button>
              </div>
            </div>

            <div className="crm-ws-body">
              <div className="crm-ws-main">
                <Tabs defaultValue="etapas">
                  <TabsList>
                    <TabsTrigger value="etapas">Etapas</TabsTrigger>
                    <TabsTrigger value="checklist">Checklist</TabsTrigger>
                    <TabsTrigger value="cronograma">Cronograma</TabsTrigger>
                    <TabsTrigger value="arquivos">Arquivos</TabsTrigger>
                    <TabsTrigger value="mensagens">Mensagens</TabsTrigger>
                    <TabsTrigger value="timeline">Timeline</TabsTrigger>
                  </TabsList>
                  <TabsContent value="etapas">
                    <ProjectPhasesTab project={data} onChanged={refresh} />
                  </TabsContent>
                  <TabsContent value="checklist">
                    <ProjectChecklistTab project={data} onChanged={refresh} />
                  </TabsContent>
                  <TabsContent value="cronograma">
                    <ProjectScheduleTab project={data} />
                  </TabsContent>
                  <TabsContent value="arquivos">
                    <ProjectFilesTab projectId={data.id} files={data.files} onChanged={refresh} />
                  </TabsContent>
                  <TabsContent value="mensagens">
                    <ProjectPortalMessagesTab projectId={data.id} />
                  </TabsContent>
                  <TabsContent value="timeline">
                    <ProjectTimelineTab project={data} />
                  </TabsContent>
                </Tabs>
              </div>
              <div className="crm-ws-side">
                <ProjectSummarySidebar project={data} onChanged={refresh} onDeleted={close} />
              </div>
            </div>

            <ProjectTaskDialog projectId={data.id} owners={owners} onSaved={refresh} />
          </ProjectTaskDialogProvider>
        )}
      </DrawerContent>
    </Drawer>
  );
}
