"use client";

import { PortalChecklistList } from "@/components/clientPortal/PortalChecklistList";
import { PortalFilesPanel } from "@/components/clientPortal/PortalFilesPanel";
import { PortalMessagesPanel } from "@/components/clientPortal/PortalMessagesPanel";
import { PortalTimelineList } from "@/components/clientPortal/PortalTimelineList";
import { ProjectScheduleTab } from "@/components/projects/ProjectScheduleTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PortalMessagesProvider } from "@/contexts/clientPortal/PortalMessagesContext";
import { buildPortalProjectTimeline } from "@/domain/clientPortal/timeline";
import type { PortalProjectDetail } from "@/types/clientPortal";

export function PortalProjectTabs({
  project,
  canUploadFiles,
}: {
  project: PortalProjectDetail;
  canUploadFiles: boolean;
}) {
  const timeline = buildPortalProjectTimeline(project);

  return (
    <Tabs defaultValue="cronograma">
      <TabsList>
        <TabsTrigger value="cronograma">Cronograma</TabsTrigger>
        <TabsTrigger value="checklist">Checklist</TabsTrigger>
        <TabsTrigger value="arquivos">Arquivos</TabsTrigger>
        <TabsTrigger value="comentarios">Comentários</TabsTrigger>
        <TabsTrigger value="timeline">Linha do tempo</TabsTrigger>
      </TabsList>
      <TabsContent value="cronograma">
        <ProjectScheduleTab project={project} />
      </TabsContent>
      <TabsContent value="checklist">
        <PortalChecklistList project={project} />
      </TabsContent>
      <TabsContent value="arquivos">
        <PortalFilesPanel
          projectId={project.id}
          files={project.files}
          canUploadFiles={canUploadFiles}
        />
      </TabsContent>
      <TabsContent value="comentarios">
        <PortalMessagesProvider projectId={project.id} initialMessages={project.messages}>
          <PortalMessagesPanel />
        </PortalMessagesProvider>
      </TabsContent>
      <TabsContent value="timeline">
        <PortalTimelineList entries={timeline} />
      </TabsContent>
    </Tabs>
  );
}
