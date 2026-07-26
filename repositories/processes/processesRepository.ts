import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  computeChecklistProgress,
  computeExecutedMinutes,
  computeProcessProgressPercent,
} from "@/domain/processes/progress";
import type {
  ProcessCategoryColor,
  ProcessChecklistItemStatus,
  ProcessStatus,
  ProcessStepStatus,
  ProcessSummary,
} from "@/types/processes";

interface ProcessRow {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  description: string | null;
  category_id: string | null;
  owner_id: string | null;
  status: ProcessStatus;
  estimated_minutes: number | null;
  started_at: string | null;
  completed_at: string | null;
  template_id: string | null;
  client_id: string | null;
  project_id: string | null;
  crm_lead_id: string | null;
  category?: { name: string; color: ProcessCategoryColor; icon: string } | null;
  owner?: { name: string | null; email: string | null } | null;
  client?: { company: string } | null;
  project?: { name: string } | null;
  crm_lead?: { name: string } | null;
  template?: { name: string } | null;
  steps?: { status: ProcessStepStatus }[] | null;
  checklist?: { status: ProcessChecklistItemStatus }[] | null;
  approvals?: { status: string }[] | null;
}

const PROCESS_SELECT = `
  id, created_at, updated_at, name, description, category_id, owner_id, status,
  estimated_minutes, started_at, completed_at, template_id, client_id, project_id, crm_lead_id,
  category:crm_process_categories!crm_processes_category_id_fkey(name, color, icon),
  owner:profiles!crm_processes_owner_id_fkey(name, email),
  client:clients!crm_processes_client_id_fkey(company),
  project:crm_projects!crm_processes_project_id_fkey(name),
  crm_lead:crm_leads!crm_processes_crm_lead_id_fkey(name),
  template:crm_process_templates!crm_processes_template_id_fkey(name),
  steps:crm_process_steps!crm_process_steps_process_id_fkey(status),
  checklist:crm_process_checklist_items!crm_process_checklist_items_process_id_fkey(status),
  approvals:crm_process_approvals!crm_process_approvals_process_id_fkey(status)
`;

function mapProcess(row: ProcessRow): ProcessSummary {
  const steps = row.steps ?? [];
  const stepsDoneCount = steps.filter((s) => s.status === "concluido").length;
  const checklistProgress = computeChecklistProgress(row.checklist ?? []);
  const pendingApprovalCount = (row.approvals ?? []).filter((a) => a.status === "pendente").length;

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    categoryId: row.category_id,
    categoryName: row.category?.name ?? null,
    categoryColor: row.category?.color ?? null,
    categoryIcon: row.category?.icon ?? null,
    ownerId: row.owner_id,
    ownerName: row.owner?.name ?? row.owner?.email ?? null,
    status: row.status,
    estimatedMinutes: row.estimated_minutes,
    executedMinutes: computeExecutedMinutes(row.started_at, row.completed_at),
    startedAt: row.started_at,
    completedAt: row.completed_at,
    clientId: row.client_id,
    clientCompany: row.client?.company ?? null,
    projectId: row.project_id,
    projectName: row.project?.name ?? null,
    crmLeadId: row.crm_lead_id,
    crmLeadName: row.crm_lead?.name ?? null,
    templateId: row.template_id,
    templateName: row.template?.name ?? null,
    stepCount: steps.length,
    stepsDoneCount,
    checklistTotal: checklistProgress.total,
    checklistDoneCount: checklistProgress.done,
    progressPercent: computeProcessProgressPercent({
      checklistTotal: checklistProgress.total,
      checklistDone: checklistProgress.done,
      stepTotal: steps.length,
      stepsDone: stepsDoneCount,
      status: row.status,
    }),
    pendingApprovalCount,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface ListProcessesOptions {
  search?: string;
  categoryId?: string;
  ownerId?: string;
  status?: ProcessStatus;
  clientId?: string;
  projectId?: string;
  limit?: number;
  offset?: number;
}

export interface ProcessesPage {
  processes: ProcessSummary[];
  total: number;
}

export async function listProcesses(
  supabase: SupabaseClient,
  options: ListProcessesOptions = {},
): Promise<ProcessesPage> {
  let query = supabase
    .from("crm_processes")
    .select(PROCESS_SELECT, { count: "exact" })
    .is("deleted_at", null);

  if (options.categoryId) query = query.eq("category_id", options.categoryId);
  if (options.ownerId) query = query.eq("owner_id", options.ownerId);
  if (options.status) query = query.eq("status", options.status);
  if (options.clientId) query = query.eq("client_id", options.clientId);
  if (options.projectId) query = query.eq("project_id", options.projectId);
  if (options.search) {
    const term = options.search.replace(/[,()%]/g, " ").trim();
    if (term) query = query.ilike("name", `%${term}%`);
  }

  const { data, error, count } = await query
    .order("updated_at", { ascending: false })
    .range(options.offset ?? 0, (options.offset ?? 0) + (options.limit ?? 50) - 1);

  if (error) throw new Error(`Falha ao carregar processos: ${error.message}`);

  let processes = ((data ?? []) as unknown as ProcessRow[]).map(mapProcess);

  // Busca por descrição também precisa entrar (nome já é filtrado no banco
  // acima) — mesmo approach de filtro em JS pós-query usado no restante do
  // app para campos que não dá para cobrir só com ilike no servidor.
  if (options.search) {
    const term = options.search.toLowerCase();
    processes = processes.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.description?.toLowerCase().includes(term) ||
        p.categoryName?.toLowerCase().includes(term),
    );
  }

  return { processes, total: count ?? processes.length };
}

export async function getProcessById(
  supabase: SupabaseClient,
  id: string,
): Promise<ProcessSummary | null> {
  const { data, error } = await supabase
    .from("crm_processes")
    .select(PROCESS_SELECT)
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw new Error(`Falha ao carregar processo: ${error.message}`);
  return data ? mapProcess(data as unknown as ProcessRow) : null;
}

export interface CreateProcessPayload {
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

export async function createProcess(
  supabase: SupabaseClient,
  payload: CreateProcessPayload,
): Promise<{ id: string }> {
  const { data, error } = await supabase
    .from("crm_processes")
    .insert({
      name: payload.name,
      description: payload.description,
      category_id: payload.categoryId,
      owner_id: payload.ownerId,
      estimated_minutes: payload.estimatedMinutes,
      template_id: payload.templateId,
      client_id: payload.clientId,
      project_id: payload.projectId,
      crm_lead_id: payload.crmLeadId,
      created_by: payload.createdBy,
      updated_by: payload.createdBy,
    })
    .select("id")
    .single();

  if (error) throw new Error(`Falha ao criar processo: ${error.message}`);
  return data as { id: string };
}

export interface UpdateProcessPayload {
  name?: string;
  description?: string | null;
  categoryId?: string | null;
  ownerId?: string | null;
  estimatedMinutes?: number | null;
  clientId?: string | null;
  projectId?: string | null;
  crmLeadId?: string | null;
  updatedBy?: string | null;
}

export async function updateProcess(
  supabase: SupabaseClient,
  id: string,
  patch: UpdateProcessPayload,
): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (patch.name !== undefined) payload.name = patch.name;
  if (patch.description !== undefined) payload.description = patch.description;
  if (patch.categoryId !== undefined) payload.category_id = patch.categoryId;
  if (patch.ownerId !== undefined) payload.owner_id = patch.ownerId;
  if (patch.estimatedMinutes !== undefined) payload.estimated_minutes = patch.estimatedMinutes;
  if (patch.clientId !== undefined) payload.client_id = patch.clientId;
  if (patch.projectId !== undefined) payload.project_id = patch.projectId;
  if (patch.crmLeadId !== undefined) payload.crm_lead_id = patch.crmLeadId;
  if (patch.updatedBy !== undefined) payload.updated_by = patch.updatedBy;

  const { error } = await supabase.from("crm_processes").update(payload).eq("id", id);
  if (error) throw new Error(`Falha ao atualizar processo: ${error.message}`);
}

export interface UpdateProcessStatusPayload {
  status: ProcessStatus;
  startedAt?: string | null;
  completedAt?: string | null;
}

export async function updateProcessStatus(
  supabase: SupabaseClient,
  id: string,
  patch: UpdateProcessStatusPayload,
): Promise<void> {
  const payload: Record<string, unknown> = { status: patch.status };
  if (patch.startedAt !== undefined) payload.started_at = patch.startedAt;
  if (patch.completedAt !== undefined) payload.completed_at = patch.completedAt;

  const { error } = await supabase.from("crm_processes").update(payload).eq("id", id);
  if (error) throw new Error(`Falha ao atualizar status do processo: ${error.message}`);
}

export async function archiveProcess(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase
    .from("crm_processes")
    .update({ status: "arquivado" })
    .eq("id", id);
  if (error) throw new Error(`Falha ao arquivar processo: ${error.message}`);
}
