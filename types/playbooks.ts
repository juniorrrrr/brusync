export type PlaybookStatus = "rascunho" | "ativo" | "em_revisao" | "arquivado";

export type PlaybookStepStatus = "pendente" | "concluido";

export type PlaybookCategory =
  | "primeiro_contato"
  | "diagnostico"
  | "reuniao"
  | "proposta"
  | "negociacao"
  | "follow_up"
  | "implantacao"
  | "pos_venda"
  | "renovacao";

export type PlaybookSuggestionType = "ligacao" | "reuniao" | "follow_up" | "tarefa";

export type PlaybookCommunicationChannel = "whatsapp" | "email" | "conversa";

export interface PlaybookLinkedDocument {
  documentId: string;
  title: string;
  categoryName: string | null;
}

export interface PlaybookStep {
  id: string;
  playbookId: string;
  title: string;
  description: string | null;
  objective: string | null;
  checklist: string[];
  estimatedMinutes: number | null;
  notes: string | null;
  links: { label: string; url: string }[];
  files: { name: string; url: string }[];
  scripts: string[];
  bestPractices: string[];
  commonMistakes: string[];
  approvalCriteria: string[];
  rejectionCriteria: string[];
  suggestedActions: PlaybookSuggestionType[];
  communicationChannels: PlaybookCommunicationChannel[];
  linkedDocuments: PlaybookLinkedDocument[];
  position: number;
  status: PlaybookStepStatus;
}

export interface PlaybookTemplate {
  id: string;
  name: string;
  category: PlaybookCategory;
  description: string | null;
  objective: string | null;
  stepsBlueprint: Omit<PlaybookStep, "id" | "playbookId" | "status" | "linkedDocuments">[];
  isDefault: boolean;
  createdAt: string;
}

export interface PlaybookSummary {
  id: string;
  name: string;
  description: string | null;
  category: PlaybookCategory;
  objective: string | null;
  pipeline: string | null;
  pipelineStageId: string | null;
  pipelineStageName: string | null;
  ownerId: string | null;
  ownerName: string | null;
  status: PlaybookStatus;
  version: number;
  executionCount: number;
  stepCount: number;
  completedStepCount: number;
  pendingStepCount: number;
  averageStepMinutes: number | null;
  updatedAt: string;
}

export interface PlaybookDetail extends PlaybookSummary {
  steps: PlaybookStep[];
  history: PlaybookHistoryEntry[];
}

export interface PlaybookHistoryEntry {
  id: string;
  playbookId: string;
  eventType: string;
  description: string;
  actorName: string | null;
  createdAt: string;
}

export interface PlaybookListFilters {
  status?: PlaybookStatus;
  category?: PlaybookCategory;
  stageId?: string;
  search?: string;
}

export interface PlaybooksPageData {
  playbooks: PlaybookSummary[];
  total: number;
}

export interface PlaybookDashboardData {
  activePlaybooks: number;
  reviewPlaybooks: number;
  completedSteps: number;
  pendingSteps: number;
  averageStepMinutes: number | null;
  mostUsedPlaybooks: PlaybookSummary[];
  recentPlaybooks: PlaybookSummary[];
}
