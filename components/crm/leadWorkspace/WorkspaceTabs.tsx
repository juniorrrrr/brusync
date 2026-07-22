"use client";

import { useState } from "react";
import { ConversionsTab } from "@/components/crm/leadWorkspace/ConversionsTab";
import { FilesTab } from "@/components/crm/leadWorkspace/FilesTab";
import { JourneyTab } from "@/components/crm/leadWorkspace/JourneyTab";
import { MarketingTab } from "@/components/crm/leadWorkspace/MarketingTab";
import { NotesTab } from "@/components/crm/leadWorkspace/NotesTab";
import { TasksTab } from "@/components/crm/leadWorkspace/TasksTab";
import { TimelineTab } from "@/components/crm/leadWorkspace/TimelineTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TAB_KEYS = [
  "timeline",
  "journey",
  "conversions",
  "notes",
  "tasks",
  "files",
  "marketing",
] as const;

export function WorkspaceTabs({
  crmLeadId,
  refreshToken,
}: {
  crmLeadId: string;
  refreshToken: string;
}) {
  const [visited, setVisited] = useState<Set<(typeof TAB_KEYS)[number]>>(new Set(["timeline"]));

  function handleValueChange(value: string) {
    setVisited((prev) => new Set(prev).add(value as (typeof TAB_KEYS)[number]));
  }

  return (
    <Tabs defaultValue="timeline" onValueChange={handleValueChange}>
      <TabsList>
        <TabsTrigger value="timeline">Timeline</TabsTrigger>
        <TabsTrigger value="journey">Jornada Comercial</TabsTrigger>
        <TabsTrigger value="conversions">Conversões</TabsTrigger>
        <TabsTrigger value="notes">Notas</TabsTrigger>
        <TabsTrigger value="tasks">Tarefas</TabsTrigger>
        <TabsTrigger value="files">Arquivos</TabsTrigger>
        <TabsTrigger value="marketing">Marketing</TabsTrigger>
      </TabsList>

      <TabsContent value="timeline">
        {visited.has("timeline") && (
          <TimelineTab crmLeadId={crmLeadId} refreshToken={refreshToken} />
        )}
      </TabsContent>
      <TabsContent value="journey">
        {visited.has("journey") && <JourneyTab crmLeadId={crmLeadId} refreshToken={refreshToken} />}
      </TabsContent>
      <TabsContent value="conversions">
        {visited.has("conversions") && <ConversionsTab crmLeadId={crmLeadId} />}
      </TabsContent>
      <TabsContent value="notes">
        {visited.has("notes") && <NotesTab crmLeadId={crmLeadId} />}
      </TabsContent>
      <TabsContent value="tasks">
        {visited.has("tasks") && <TasksTab crmLeadId={crmLeadId} />}
      </TabsContent>
      <TabsContent value="files">
        {visited.has("files") && <FilesTab crmLeadId={crmLeadId} />}
      </TabsContent>
      <TabsContent value="marketing">
        {visited.has("marketing") && <MarketingTab crmLeadId={crmLeadId} />}
      </TabsContent>
    </Tabs>
  );
}
