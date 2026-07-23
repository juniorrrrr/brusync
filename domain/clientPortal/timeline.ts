import { buildProjectTimeline } from "@/domain/projects/timeline";
import type { PortalMessage, PortalProjectDetail, PortalTimelineEntry } from "@/types/clientPortal";

/** Same computed-timeline idea as domain/projects/timeline.ts, extended with
 * portal messages — "Tudo registrado na Timeline" (Fase 13) means a message
 * is itself the record, exactly like a phase/task timestamp already is; no
 * separate log table for it either. */
export function buildPortalProjectTimeline(project: PortalProjectDetail): PortalTimelineEntry[] {
  const entries = buildProjectTimeline(project);
  const messageEntries = project.messages.map((message) =>
    messageToTimelineEntry(project, message),
  );
  return [...entries, ...messageEntries].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
}

function messageToTimelineEntry(
  project: PortalProjectDetail,
  message: PortalMessage,
): PortalTimelineEntry {
  return {
    id: `${message.id}-message`,
    kind: message.authorType === "cliente" ? "mensagem_cliente" : "mensagem_equipe",
    title:
      message.authorType === "cliente"
        ? `Mensagem de ${message.authorName}`
        : `Resposta de ${message.authorName}`,
    subtitle: message.body,
    projectId: project.id,
    projectName: project.name,
    occurredAt: message.createdAt,
  };
}
