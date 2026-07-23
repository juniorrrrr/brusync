export type ProjectStatus = "planejamento" | "em_andamento" | "pausado" | "concluido" | "cancelado";

export type ProjectPhaseStatus = "pendente" | "em_andamento" | "concluido";

export type ProjectTaskStatus = "pendente" | "em_andamento" | "concluido";

export type ProjectTaskPriority = "baixa" | "media" | "alta";

export interface ProjectTaskComment {
  id: string;
  authorId: string | null;
  authorName: string | null;
  body: string;
  createdAt: string;
}

export interface ProjectTask {
  id: string;
  projectId: string;
  phaseId: string | null;
  title: string;
  description: string | null;
  assigneeId: string | null;
  assigneeName: string | null;
  priority: ProjectTaskPriority;
  dueAt: string | null;
  status: ProjectTaskStatus;
  completedAt: string | null;
  comments: ProjectTaskComment[];
  fileCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectPhase {
  id: string;
  projectId: string;
  name: string;
  position: number;
  status: ProjectPhaseStatus;
  startedAt: string | null;
  dueAt: string | null;
  completedAt: string | null;
  tasks: ProjectTask[];
  progressPercent: number;
}

export interface ProjectFile {
  id: string;
  projectId: string;
  taskId: string | null;
  storagePath: string;
  fileName: string;
  fileSize: number | null;
  mimeType: string | null;
  uploadedBy: string | null;
  uploadedByName: string | null;
  createdAt: string;
}

export interface Project {
  id: string;
  clientId: string;
  clientCompany: string | null;
  name: string;
  description: string | null;
  status: ProjectStatus;
  ownerId: string | null;
  ownerName: string | null;
  startedAt: string | null;
  dueAt: string | null;
  completedAt: string | null;
  progressPercent: number;
  taskCount: number;
  taskDoneCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectDetail extends Project {
  phases: ProjectPhase[];
  files: ProjectFile[];
}

export type ProjectTimelineEventKind =
  | "projeto_criado"
  | "etapa_iniciada"
  | "etapa_concluida"
  | "tarefa_concluida"
  | "arquivo_enviado"
  | "projeto_finalizado";

export interface ProjectTimelineEntry {
  id: string;
  kind: ProjectTimelineEventKind;
  title: string;
  subtitle: string | null;
  projectId: string;
  projectName: string;
  occurredAt: string;
}

export interface ProjectsHealth {
  activeProjects: number;
  completedProjects: number;
  overdueProjects: number;
  averageDeliveryDays: number | null;
  byOwner: { ownerId: string | null; ownerName: string | null; count: number }[];
  byStatus: { status: ProjectStatus; count: number }[];
}
