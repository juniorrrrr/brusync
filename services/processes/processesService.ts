import "server-only";

import { getLeadsPageData, getOwnerOptions } from "@/application/crm/leadsQueries";
import {
  getClientFilterOptions,
  getProjectsPageData,
} from "@/application/projects/projectsQueries";
import { buildProcessDashboardData } from "@/domain/processes/dashboard";
import {
  describeApprovalDecided,
  describeApprovalRequested,
  describeChecklistItemCompleted,
  describeChecklistItemReopened,
  describeDocumentAttached,
  describeFileAttached,
  describeOwnerChanged,
  describeProcessArchived,
  describeProcessCreated,
  describeProcessUpdated,
  describeStatusChanged,
  describeStepCompleted,
  describeStepStarted,
} from "@/domain/processes/history";
import { computeStepProgressPercent } from "@/domain/processes/progress";
import {
  getDemoProcessCategories,
  getDemoProcessDashboardData,
  getDemoProcessDetail,
  getDemoProcessesPageData,
  getDemoProcessTemplates,
} from "@/lib/demo/mockProcesses";
import * as approvalsRepo from "@/repositories/processes/approvalsRepository";
import * as categoriesRepo from "@/repositories/processes/categoriesRepository";
import * as checklistRepo from "@/repositories/processes/checklistRepository";
import * as documentsRepo from "@/repositories/processes/documentsRepository";
import * as filesRepo from "@/repositories/processes/filesRepository";
import * as historyRepo from "@/repositories/processes/historyRepository";
import * as processesRepo from "@/repositories/processes/processesRepository";
import * as stepsRepo from "@/repositories/processes/stepsRepository";
import * as templatesRepo from "@/repositories/processes/templatesRepository";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type {
  ProcessApproval,
  ProcessCategory,
  ProcessChecklistItem,
  ProcessChecklistItemStatus,
  ProcessDashboardData,
  ProcessDetail,
  ProcessesPageData,
  ProcessFile,
  ProcessFilterOptions,
  ProcessListFilters,
  ProcessStatus,
  ProcessStep,
  ProcessStepStatus,
  ProcessSummary,
  ProcessTemplate,
} from "@/types/processes";

// ----------------------------------------------------------------------------
// Leitura
// ----------------------------------------------------------------------------

export async function getProcessCategories(): Promise<ProcessCategory[]> {
  if (await isDemoModeActive()) return getDemoProcessCategories();
  const supabase = await getSupabaseAuthClient();
  return categoriesRepo.listCategories(supabase);
}

export async function getProcessTemplates(): Promise<ProcessTemplate[]> {
  if (await isDemoModeActive()) return getDemoProcessTemplates();
  const supabase = await getSupabaseAuthClient();
  return templatesRepo.listTemplates(supabase);
}

async function getProcessFilterOptions(): Promise<ProcessFilterOptions> {
  const [categories, owners] = await Promise.all([getProcessCategories(), getOwnerOptions()]);
  return {
    categories: categories.map((category) => ({
      id: category.id,
      name: category.name,
      color: category.color,
    })),
    owners: owners.map((owner) => ({ id: owner.id, name: owner.name ?? owner.email })),
  };
}

export interface ProcessFormOptions extends ProcessFilterOptions {
  templates: ProcessTemplate[];
  clients: { id: string; company: string }[];
  projects: { id: string; name: string }[];
  leads: { id: string; name: string }[];
}

/** Opções para o modal de criar/editar processo — categorias, responsáveis e
 * templates reaproveitam getProcessFilterOptions/getProcessTemplates;
 * clientes/projetos/leads reaproveitam os fetchers já existentes de outros
 * módulos (nenhuma query nova de listagem). */
export async function getProcessFormOptions(): Promise<ProcessFormOptions> {
  const [filterOptions, templates, clients, projectsPage, leadsPage] = await Promise.all([
    getProcessFilterOptions(),
    getProcessTemplates(),
    getClientFilterOptions(),
    getProjectsPageData({ limit: 100 }),
    getLeadsPageData({ limit: 100 }),
  ]);

  return {
    ...filterOptions,
    templates,
    clients,
    projects: projectsPage.projects.map((project) => ({ id: project.id, name: project.name })),
    leads: leadsPage.leads.map((lead) => ({ id: lead.id, name: lead.name })),
  };
}

export async function getProcessesPageData(
  filters: ProcessListFilters,
): Promise<ProcessesPageData> {
  if (await isDemoModeActive()) return getDemoProcessesPageData(filters);

  const supabase = await getSupabaseAuthClient();
  const [{ processes, total }, filterOptions] = await Promise.all([
    processesRepo.listProcesses(supabase, {
      search: filters.search,
      categoryId: filters.categoryId,
      ownerId: filters.ownerId,
      status: filters.status,
      clientId: filters.clientId,
      projectId: filters.projectId,
      limit: 200,
    }),
    getProcessFilterOptions(),
  ]);

  return { processes, total, filterOptions };
}

export async function getProcessDashboardData(): Promise<ProcessDashboardData> {
  if (await isDemoModeActive()) return getDemoProcessDashboardData();

  const supabase = await getSupabaseAuthClient();
  const [{ processes }, categories, recentHistory, pendingApprovals] = await Promise.all([
    processesRepo.listProcesses(supabase, { limit: 500 }),
    categoriesRepo.listCategories(supabase),
    historyRepo.listRecentHistory(supabase, 12),
    approvalsRepo.listPendingApprovals(supabase, 10),
  ]);

  return buildProcessDashboardData(processes, categories, recentHistory, pendingApprovals);
}

export async function getProcessDetail(id: string): Promise<ProcessDetail | null> {
  if (await isDemoModeActive()) return getDemoProcessDetail(id);

  const supabase = await getSupabaseAuthClient();
  const summary = await processesRepo.getProcessById(supabase, id);
  if (!summary) return null;

  const [stepRows, checklistItems, approvals, history, documents, files] = await Promise.all([
    stepsRepo.listStepsForProcess(supabase, id),
    checklistRepo.listChecklistForProcess(supabase, id),
    approvalsRepo.listApprovalsForProcess(supabase, id),
    historyRepo.listHistoryForProcess(supabase, id),
    documentsRepo.listDocumentsForProcess(supabase, id),
    filesRepo.listFilesForProcess(supabase, id),
  ]);

  const steps: ProcessStep[] = stepRows.map((step) => {
    const items = checklistItems.filter((item) => item.stepId === step.id);
    return {
      id: step.id,
      processId: step.processId,
      name: step.name,
      description: step.description,
      position: step.position,
      status: step.status,
      startedAt: step.startedAt,
      completedAt: step.completedAt,
      checklistItems: items,
      progressPercent: computeStepProgressPercent({ status: step.status, checklistItems: items }),
    };
  });

  return {
    ...summary,
    steps,
    standaloneChecklist: checklistItems.filter((item) => item.stepId === null),
    approvals,
    history,
    documents,
    files,
  };
}

// ----------------------------------------------------------------------------
// Escrita — nenhuma função aqui verifica Modo Demonstração; o bloqueio
// acontece na Server Action (application/processes/processesActions.ts),
// mesmo padrão de services/performance/performanceService.ts.
// ----------------------------------------------------------------------------

export interface CreateProcessInput {
  name: string;
  description: string | null;
  categoryId: string | null;
  ownerId: string | null;
  estimatedMinutes: number | null;
  templateId: string | null;
  clientId: string | null;
  projectId: string | null;
  crmLeadId: string | null;
  createdBy: string | null;
}

export async function createProcessRecord(input: CreateProcessInput): Promise<{ id: string }> {
  const supabase = await getSupabaseAuthClient();

  let estimatedMinutes = input.estimatedMinutes;
  let stepsBlueprint: ProcessTemplate["stepsBlueprint"] = [];
  if (input.templateId) {
    const template = await templatesRepo.getTemplateById(supabase, input.templateId);
    if (template) {
      if (estimatedMinutes === null) estimatedMinutes = template.defaultEstimatedMinutes;
      stepsBlueprint = template.stepsBlueprint;
    }
  }

  const { id } = await processesRepo.createProcess(supabase, {
    name: input.name,
    description: input.description,
    categoryId: input.categoryId,
    ownerId: input.ownerId,
    estimatedMinutes,
    templateId: input.templateId,
    clientId: input.clientId,
    projectId: input.projectId,
    crmLeadId: input.crmLeadId,
    createdBy: input.createdBy,
  });

  for (const stepBlueprint of stepsBlueprint) {
    const step = await stepsRepo.createStep(supabase, {
      processId: id,
      name: stepBlueprint.name,
      description: stepBlueprint.description,
      position: stepBlueprint.position,
    });
    for (const item of stepBlueprint.checklist) {
      await checklistRepo.createChecklistItem(supabase, {
        processId: id,
        stepId: step.id,
        label: item.label,
        position: item.position,
      });
    }
  }

  await historyRepo.insertHistoryEntry(supabase, {
    processId: id,
    eventType: "processo_criado",
    description: describeProcessCreated(input.name),
    actorId: input.createdBy,
  });

  return { id };
}

export interface UpdateProcessInput {
  name?: string;
  description?: string | null;
  categoryId?: string | null;
  ownerId?: string | null;
  estimatedMinutes?: number | null;
  clientId?: string | null;
  projectId?: string | null;
  crmLeadId?: string | null;
  updatedBy: string | null;
}

export async function updateProcessRecord(id: string, input: UpdateProcessInput): Promise<void> {
  const supabase = await getSupabaseAuthClient();

  let historyDescription = describeProcessUpdated();
  let historyEvent: "responsavel_alterado" | "processo_atualizado" = "processo_atualizado";

  if (input.ownerId !== undefined) {
    const current = await processesRepo.getProcessById(supabase, id);
    if (current && current.ownerId !== input.ownerId) {
      const owners = await getOwnerOptions();
      const toOwner = owners.find((owner) => owner.id === input.ownerId);
      historyDescription = describeOwnerChanged(
        current.ownerName,
        toOwner?.name ?? toOwner?.email ?? null,
      );
      historyEvent = "responsavel_alterado";
    }
  }

  await processesRepo.updateProcess(supabase, id, {
    name: input.name,
    description: input.description,
    categoryId: input.categoryId,
    ownerId: input.ownerId,
    estimatedMinutes: input.estimatedMinutes,
    clientId: input.clientId,
    projectId: input.projectId,
    crmLeadId: input.crmLeadId,
    updatedBy: input.updatedBy,
  });

  await historyRepo.insertHistoryEntry(supabase, {
    processId: id,
    eventType: historyEvent,
    description: historyDescription,
    actorId: input.updatedBy,
  });
}

export async function updateProcessStatusRecord(
  id: string,
  status: ProcessStatus,
  actorId: string | null,
): Promise<void> {
  const supabase = await getSupabaseAuthClient();
  const current = await processesRepo.getProcessById(supabase, id);
  if (!current) throw new Error("Processo não encontrado.");

  const now = new Date().toISOString();
  const patch: { status: ProcessStatus; startedAt?: string | null; completedAt?: string | null } = {
    status,
  };
  if (status === "ativo" && !current.startedAt) patch.startedAt = now;
  if (status === "concluido") patch.completedAt = now;
  if (status !== "concluido" && current.completedAt) patch.completedAt = null;

  await processesRepo.updateProcessStatus(supabase, id, patch);

  await historyRepo.insertHistoryEntry(supabase, {
    processId: id,
    eventType: "status_alterado",
    description: describeStatusChanged(current.status, status),
    actorId,
  });
}

export async function archiveProcessRecord(id: string, actorId: string | null): Promise<void> {
  const supabase = await getSupabaseAuthClient();
  await processesRepo.archiveProcess(supabase, id);
  await historyRepo.insertHistoryEntry(supabase, {
    processId: id,
    eventType: "processo_arquivado",
    description: describeProcessArchived(),
    actorId,
  });
}

export interface AddStepInput {
  processId: string;
  name: string;
  description: string | null;
  position: number;
}

export async function addProcessStep(input: AddStepInput) {
  const supabase = await getSupabaseAuthClient();
  return stepsRepo.createStep(supabase, input);
}

export async function updateProcessStepStatus(
  stepId: string,
  processId: string,
  status: ProcessStepStatus,
  actorId: string | null,
): Promise<void> {
  const supabase = await getSupabaseAuthClient();
  const now = new Date().toISOString();
  const patch: {
    status: ProcessStepStatus;
    startedAt?: string | null;
    completedAt?: string | null;
  } = {
    status,
  };
  if (status === "em_andamento") patch.startedAt = now;
  if (status === "concluido") patch.completedAt = now;

  await stepsRepo.updateStepStatus(supabase, stepId, patch);

  if (status === "em_andamento" || status === "concluido") {
    const steps = await stepsRepo.listStepsForProcess(supabase, processId);
    const step = steps.find((s) => s.id === stepId);
    if (step) {
      await historyRepo.insertHistoryEntry(supabase, {
        processId,
        eventType: status === "concluido" ? "etapa_concluida" : "etapa_iniciada",
        description:
          status === "concluido"
            ? describeStepCompleted(step.name)
            : describeStepStarted(step.name),
        actorId,
      });
    }
  }
}

export async function removeProcessStep(stepId: string): Promise<void> {
  const supabase = await getSupabaseAuthClient();
  await stepsRepo.deleteStep(supabase, stepId);
}

export interface AddChecklistItemInput {
  processId: string;
  stepId: string | null;
  label: string;
  position: number;
}

export async function addChecklistItemRecord(
  input: AddChecklistItemInput,
): Promise<ProcessChecklistItem> {
  const supabase = await getSupabaseAuthClient();
  return checklistRepo.createChecklistItem(supabase, input);
}

export async function toggleChecklistItemRecord(
  itemId: string,
  processId: string,
  nextStatus: ProcessChecklistItemStatus,
  actorId: string | null,
): Promise<ProcessChecklistItem> {
  const supabase = await getSupabaseAuthClient();
  const completedAt = nextStatus === "concluido" ? new Date().toISOString() : null;

  const item = await checklistRepo.updateChecklistItemStatus(supabase, itemId, {
    status: nextStatus,
    completedAt,
    completedBy: nextStatus === "concluido" ? actorId : null,
  });

  await historyRepo.insertHistoryEntry(supabase, {
    processId,
    eventType: nextStatus === "concluido" ? "checklist_item_concluido" : "checklist_item_reaberto",
    description:
      nextStatus === "concluido"
        ? describeChecklistItemCompleted(item.label)
        : describeChecklistItemReopened(item.label),
    actorId,
  });

  return item;
}

export async function removeChecklistItemRecord(itemId: string): Promise<void> {
  const supabase = await getSupabaseAuthClient();
  await checklistRepo.deleteChecklistItem(supabase, itemId);
}

export interface RequestApprovalInput {
  processId: string;
  stepId: string | null;
  notes: string | null;
  requestedBy: string | null;
}

export async function requestApprovalRecord(input: RequestApprovalInput): Promise<ProcessApproval> {
  const supabase = await getSupabaseAuthClient();
  const approval = await approvalsRepo.createApprovalRequest(supabase, input);

  if (!input.stepId) {
    await processesRepo.updateProcessStatus(supabase, input.processId, {
      status: "aguardando_aprovacao",
    });
  }

  await historyRepo.insertHistoryEntry(supabase, {
    processId: input.processId,
    eventType: "aprovacao_solicitada",
    description: describeApprovalRequested(
      approval.stepName ? `a etapa "${approval.stepName}"` : "",
    ),
    actorId: input.requestedBy,
  });

  return approval;
}

export interface DecideApprovalInput {
  approvalId: string;
  processId: string;
  decision: "aprovado" | "reprovado";
  approverId: string | null;
  notes: string | null;
}

export async function decideApprovalRecord(input: DecideApprovalInput): Promise<ProcessApproval> {
  const supabase = await getSupabaseAuthClient();
  const approval = await approvalsRepo.decideApproval(supabase, input.approvalId, {
    status: input.decision,
    approverId: input.approverId,
    notes: input.notes,
  });

  if (!approval.stepId) {
    const current = await processesRepo.getProcessById(supabase, input.processId);
    if (current?.status === "aguardando_aprovacao") {
      await processesRepo.updateProcessStatus(supabase, input.processId, {
        status: input.decision === "aprovado" ? "concluido" : "ativo",
        completedAt: input.decision === "aprovado" ? new Date().toISOString() : null,
      });
    }
  }

  const owners = await getOwnerOptions();
  const approver = owners.find((owner) => owner.id === input.approverId);

  await historyRepo.insertHistoryEntry(supabase, {
    processId: input.processId,
    eventType: "aprovacao_decidida",
    description: describeApprovalDecided(input.decision, approver?.name ?? approver?.email ?? null),
    actorId: input.approverId,
  });

  return approval;
}

export async function attachDocumentRecord(
  processId: string,
  documentId: string,
  documentTitle: string,
  actorId: string | null,
): Promise<void> {
  const supabase = await getSupabaseAuthClient();
  await documentsRepo.linkDocument(supabase, processId, documentId, actorId);
  await historyRepo.insertHistoryEntry(supabase, {
    processId,
    eventType: "documento_anexado",
    description: describeDocumentAttached(documentTitle),
    actorId,
  });
}

export async function detachDocumentRecord(processId: string, documentId: string): Promise<void> {
  const supabase = await getSupabaseAuthClient();
  await documentsRepo.unlinkDocument(supabase, processId, documentId);
}

export interface UploadProcessFileInput {
  processId: string;
  file: File;
  uploadedBy: string;
}

export async function uploadProcessFileRecord(input: UploadProcessFileInput): Promise<ProcessFile> {
  const supabase = await getSupabaseAuthClient();
  const file = await filesRepo.uploadProcessFile(supabase, input);
  await historyRepo.insertHistoryEntry(supabase, {
    processId: input.processId,
    eventType: "arquivo_anexado",
    description: describeFileAttached(file.fileName),
    actorId: input.uploadedBy,
  });
  return file;
}

export async function getProcessFileUrl(storagePath: string): Promise<string> {
  const supabase = await getSupabaseAuthClient();
  return filesRepo.getProcessFileSignedUrl(supabase, storagePath);
}

export async function deleteProcessFileRecord(fileId: string, storagePath: string): Promise<void> {
  const supabase = await getSupabaseAuthClient();
  await filesRepo.deleteProcessFile(supabase, fileId, storagePath);
}

export async function getProcessSummaryById(id: string): Promise<ProcessSummary | null> {
  const supabase = await getSupabaseAuthClient();
  return processesRepo.getProcessById(supabase, id);
}
