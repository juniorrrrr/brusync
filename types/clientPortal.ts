import type {
  Project,
  ProjectDetail,
  ProjectFile,
  ProjectPhase,
  ProjectStatus,
  ProjectTask,
  ProjectTimelineEntry,
} from "@/types/projects";

/** The signed-in portal user's own access record — never another client's. */
export interface PortalAccess {
  clientId: string;
  clientCompany: string;
  canUploadFiles: boolean;
}

export type PortalProject = Project;
export type PortalProjectPhase = ProjectPhase;
export type PortalProjectTask = ProjectTask;
export type PortalProjectFile = ProjectFile;

export interface PortalProjectDetail extends ProjectDetail {
  messages: PortalMessage[];
}

export type PortalMessageAuthorType = "cliente" | "equipe";

export interface PortalMessage {
  id: string;
  projectId: string;
  authorType: PortalMessageAuthorType;
  authorProfileId: string | null;
  authorName: string;
  body: string;
  createdAt: string;
}

export type PortalTimelineEventKind =
  | ProjectTimelineEntry["kind"]
  | "mensagem_cliente"
  | "mensagem_equipe";

export interface PortalTimelineEntry extends Omit<ProjectTimelineEntry, "kind"> {
  kind: PortalTimelineEventKind;
}

export interface PortalDashboardData {
  activeProjects: number;
  completedProjects: number;
  overallProgressPercent: number;
  recentActivity: PortalTimelineEntry[];
  upcomingDeliveries: PortalUpcomingDelivery[];
}

export interface PortalUpcomingDelivery {
  id: string;
  projectId: string;
  projectName: string;
  title: string;
  dueAt: string;
  kind: "projeto" | "etapa" | "tarefa";
}

export type { ProjectStatus };
