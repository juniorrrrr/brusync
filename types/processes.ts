export type ProcessStatus =
  | "rascunho"
  | "ativo"
  | "pausado"
  | "aguardando_aprovacao"
  | "concluido"
  | "arquivado";

export type ProcessStepStatus = "pendente" | "em_andamento" | "concluido";

export type ProcessChecklistItemStatus = "pendente" | "em_andamento" | "concluido";

export type ProcessApprovalStatus = "pendente" | "aprovado" | "reprovado";

export type ProcessCategoryColor = "info" | "warn" | "ok" | "neutral" | "danger";

export type ProcessHistoryEventType =
  | "processo_criado"
  | "processo_atualizado"
  | "status_alterado"
  | "responsavel_alterado"
  | "etapa_iniciada"
  | "etapa_concluida"
  | "checklist_item_concluido"
  | "checklist_item_reaberto"
  | "documento_anexado"
  | "arquivo_anexado"
  | "aprovacao_solicitada"
  | "aprovacao_decidida"
  | "processo_arquivado";

export interface ProcessCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string;
  color: ProcessCategoryColor;
  isDefault: boolean;
  sortOrder: number;
  processCount: number;
  createdAt: string;
}

export interface ProcessChecklistItem {
  id: string;
  processId: string;
  stepId: string | null;
  label: string;
  position: number;
  status: ProcessChecklistItemStatus;
  completedAt: string | null;
  completedByName: string | null;
  createdAt: string;
}

export interface ProcessStep {
  id: string;
  processId: string;
  name: string;
  description: string | null;
  position: number;
  status: ProcessStepStatus;
  startedAt: string | null;
  completedAt: string | null;
  checklistItems: ProcessChecklistItem[];
  progressPercent: number;
}

export interface ProcessApproval {
  id: string;
  processId: string;
  stepId: string | null;
  stepName: string | null;
  status: ProcessApprovalStatus;
  notes: string | null;
  decidedAt: string | null;
  requestedById: string | null;
  requestedByName: string | null;
  approverId: string | null;
  approverName: string | null;
  createdAt: string;
}

export interface ProcessHistoryEntry {
  id: string;
  processId: string;
  processName: string | null;
  eventType: ProcessHistoryEventType;
  description: string;
  metadata: Record<string, unknown>;
  actorName: string | null;
  createdAt: string;
}

export interface ProcessDocumentLink {
  processId: string;
  documentId: string;
  documentTitle: string;
  documentCategoryName: string | null;
  createdAt: string;
}

export interface ProcessFile {
  id: string;
  processId: string;
  storagePath: string;
  fileName: string;
  fileSize: number | null;
  mimeType: string | null;
  uploadedByName: string | null;
  createdAt: string;
}

export interface ProcessTemplateChecklistBlueprint {
  label: string;
  position: number;
}

export interface ProcessTemplateStepBlueprint {
  name: string;
  description: string | null;
  position: number;
  checklist: ProcessTemplateChecklistBlueprint[];
}

export interface ProcessTemplate {
  id: string;
  name: string;
  description: string | null;
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: ProcessCategoryColor | null;
  defaultEstimatedMinutes: number | null;
  stepsBlueprint: ProcessTemplateStepBlueprint[];
  isDefault: boolean;
  createdAt: string;
}

export interface ProcessSummary {
  id: string;
  name: string;
  description: string | null;
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: ProcessCategoryColor | null;
  categoryIcon: string | null;
  ownerId: string | null;
  ownerName: string | null;
  status: ProcessStatus;
  estimatedMinutes: number | null;
  executedMinutes: number | null;
  startedAt: string | null;
  completedAt: string | null;
  clientId: string | null;
  clientCompany: string | null;
  projectId: string | null;
  projectName: string | null;
  crmLeadId: string | null;
  crmLeadName: string | null;
  templateId: string | null;
  templateName: string | null;
  stepCount: number;
  stepsDoneCount: number;
  checklistTotal: number;
  checklistDoneCount: number;
  progressPercent: number;
  pendingApprovalCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProcessDetail extends ProcessSummary {
  steps: ProcessStep[];
  standaloneChecklist: ProcessChecklistItem[];
  approvals: ProcessApproval[];
  history: ProcessHistoryEntry[];
  documents: ProcessDocumentLink[];
  files: ProcessFile[];
}

export interface ProcessOwnerOption {
  id: string;
  name: string | null;
}

export interface ProcessFilterOptions {
  categories: { id: string; name: string; color: ProcessCategoryColor }[];
  owners: ProcessOwnerOption[];
}

export interface ProcessListFilters {
  categoryId?: string;
  ownerId?: string;
  status?: ProcessStatus;
  clientId?: string;
  projectId?: string;
  search?: string;
}

export interface ProcessesPageData {
  processes: ProcessSummary[];
  total: number;
  filterOptions: ProcessFilterOptions;
}

export interface ProcessCategoryUsage {
  categoryId: string;
  categoryName: string;
  categoryColor: ProcessCategoryColor;
  categoryIcon: string;
  processCount: number;
  completedCount: number;
}

export interface ProcessOwnerWorkload {
  ownerId: string | null;
  ownerName: string | null;
  activeCount: number;
  completedCount: number;
  progressPercent: number;
}

export interface ProcessDashboardData {
  totalProcesses: number;
  activeProcesses: number;
  completedProcesses: number;
  pendingApprovalProcesses: number;
  archivedProcesses: number;
  overallProgressPercent: number;
  byCategory: ProcessCategoryUsage[];
  byStatus: { status: ProcessStatus; count: number }[];
  byOwner: ProcessOwnerWorkload[];
  recentProcesses: ProcessSummary[];
  recentHistory: ProcessHistoryEntry[];
  pendingApprovals: ProcessApproval[];
}
