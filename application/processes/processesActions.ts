"use server";

import { revalidatePath } from "next/cache";
import { requireCrmProfile } from "@/application/crm/authGuard";
import { PROCESS_STATUSES } from "@/domain/processes/statusMeta";
import { isDemoModeActive } from "@/services/demo/demoMode";
import {
  addChecklistItemRecord,
  addProcessStep,
  archiveProcessRecord,
  createProcessRecord,
  decideApprovalRecord,
  removeChecklistItemRecord,
  removeProcessStep,
  requestApprovalRecord,
  toggleChecklistItemRecord,
  updateProcessRecord,
  updateProcessStatusRecord,
  updateProcessStepStatus,
} from "@/services/processes/processesService";
import type { ProcessChecklistItem, ProcessStatus } from "@/types/processes";

const DEMO_WRITE_BLOCKED_MESSAGE =
  "Ação indisponível em Modo Demonstração — nenhuma escrita é enviada ao banco.";

export interface ProcessActionState {
  status: "idle" | "success" | "error";
  message?: string;
  id?: string;
}

function parseOptionalString(value: FormDataEntryValue | null): string | null {
  const text = String(value ?? "").trim();
  return text || null;
}

function parseOptionalNumber(value: FormDataEntryValue | null): number | null {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function createProcessAction(
  _prevState: ProcessActionState,
  formData: FormData,
): Promise<ProcessActionState> {
  const profile = await requireCrmProfile();
  if (await isDemoModeActive()) return { status: "error", message: DEMO_WRITE_BLOCKED_MESSAGE };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { status: "error", message: "Informe um nome para o processo." };

  const { id } = await createProcessRecord({
    name,
    description: parseOptionalString(formData.get("description")),
    categoryId: parseOptionalString(formData.get("categoryId")),
    ownerId: parseOptionalString(formData.get("ownerId")),
    estimatedMinutes: parseOptionalNumber(formData.get("estimatedMinutes")),
    templateId: parseOptionalString(formData.get("templateId")),
    clientId: parseOptionalString(formData.get("clientId")),
    projectId: parseOptionalString(formData.get("projectId")),
    crmLeadId: parseOptionalString(formData.get("crmLeadId")),
    createdBy: profile.id,
  });

  revalidatePath("/processos");
  return { status: "success", message: "Processo criado.", id };
}

export async function updateProcessAction(
  _prevState: ProcessActionState,
  formData: FormData,
): Promise<ProcessActionState> {
  const profile = await requireCrmProfile();
  if (await isDemoModeActive()) return { status: "error", message: DEMO_WRITE_BLOCKED_MESSAGE };

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { status: "error", message: "Processo não encontrado." };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { status: "error", message: "Informe um nome para o processo." };

  await updateProcessRecord(id, {
    name,
    description: parseOptionalString(formData.get("description")),
    categoryId: parseOptionalString(formData.get("categoryId")),
    ownerId: parseOptionalString(formData.get("ownerId")),
    estimatedMinutes: parseOptionalNumber(formData.get("estimatedMinutes")),
    clientId: parseOptionalString(formData.get("clientId")),
    projectId: parseOptionalString(formData.get("projectId")),
    crmLeadId: parseOptionalString(formData.get("crmLeadId")),
    updatedBy: profile.id,
  });

  revalidatePath("/processos");
  revalidatePath(`/processos/${id}`);
  return { status: "success", message: "Processo atualizado.", id };
}

export async function archiveProcessAction(id: string): Promise<{ ok: boolean; error?: string }> {
  const profile = await requireCrmProfile();
  if (await isDemoModeActive()) return { ok: false, error: DEMO_WRITE_BLOCKED_MESSAGE };

  await archiveProcessRecord(id, profile.id);
  revalidatePath("/processos");
  revalidatePath(`/processos/${id}`);
  return { ok: true };
}

export async function updateProcessStatusAction(
  id: string,
  status: string,
): Promise<{ ok: boolean; error?: string }> {
  const profile = await requireCrmProfile();
  if (await isDemoModeActive()) return { ok: false, error: DEMO_WRITE_BLOCKED_MESSAGE };
  if (!(PROCESS_STATUSES as string[]).includes(status)) {
    return { ok: false, error: "Status inválido." };
  }

  await updateProcessStatusRecord(id, status as ProcessStatus, profile.id);
  revalidatePath("/processos");
  revalidatePath(`/processos/${id}`);
  return { ok: true };
}

export async function addProcessStepAction(
  processId: string,
  name: string,
  position: number,
): Promise<{ ok: boolean; error?: string }> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return { ok: false, error: DEMO_WRITE_BLOCKED_MESSAGE };
  if (!name.trim()) return { ok: false, error: "Informe um nome para a etapa." };

  await addProcessStep({ processId, name: name.trim(), description: null, position });
  revalidatePath(`/processos/${processId}`);
  return { ok: true };
}

export async function updateProcessStepStatusAction(
  stepId: string,
  processId: string,
  status: string,
): Promise<{ ok: boolean; error?: string }> {
  const profile = await requireCrmProfile();
  if (await isDemoModeActive()) return { ok: false, error: DEMO_WRITE_BLOCKED_MESSAGE };
  if (!["pendente", "em_andamento", "concluido"].includes(status)) {
    return { ok: false, error: "Status inválido." };
  }

  await updateProcessStepStatus(
    stepId,
    processId,
    status as "pendente" | "em_andamento" | "concluido",
    profile.id,
  );
  revalidatePath(`/processos/${processId}`);
  return { ok: true };
}

export async function removeProcessStepAction(
  stepId: string,
  processId: string,
): Promise<{ ok: boolean; error?: string }> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return { ok: false, error: DEMO_WRITE_BLOCKED_MESSAGE };

  await removeProcessStep(stepId);
  revalidatePath(`/processos/${processId}`);
  return { ok: true };
}

export async function addChecklistItemAction(
  processId: string,
  stepId: string | null,
  label: string,
  position: number,
): Promise<{ ok: boolean; error?: string }> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return { ok: false, error: DEMO_WRITE_BLOCKED_MESSAGE };
  if (!label.trim()) return { ok: false, error: "Informe um texto para o item." };

  await addChecklistItemRecord({ processId, stepId, label: label.trim(), position });
  revalidatePath(`/processos/${processId}`);
  return { ok: true };
}

export async function toggleChecklistItemAction(
  itemId: string,
  processId: string,
  nextStatus: "pendente" | "concluido",
): Promise<{ ok: boolean; error?: string; item?: ProcessChecklistItem }> {
  const profile = await requireCrmProfile();
  if (await isDemoModeActive()) return { ok: false, error: DEMO_WRITE_BLOCKED_MESSAGE };

  const item = await toggleChecklistItemRecord(itemId, processId, nextStatus, profile.id);
  revalidatePath(`/processos/${processId}`);
  return { ok: true, item };
}

export async function removeChecklistItemAction(
  itemId: string,
  processId: string,
): Promise<{ ok: boolean; error?: string }> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return { ok: false, error: DEMO_WRITE_BLOCKED_MESSAGE };

  await removeChecklistItemRecord(itemId);
  revalidatePath(`/processos/${processId}`);
  return { ok: true };
}

export async function requestApprovalAction(
  processId: string,
  stepId: string | null,
  notes: string,
): Promise<{ ok: boolean; error?: string }> {
  const profile = await requireCrmProfile();
  if (await isDemoModeActive()) return { ok: false, error: DEMO_WRITE_BLOCKED_MESSAGE };

  await requestApprovalRecord({
    processId,
    stepId,
    notes: notes.trim() || null,
    requestedBy: profile.id,
  });
  revalidatePath(`/processos/${processId}`);
  revalidatePath("/processos");
  return { ok: true };
}

export async function decideApprovalAction(
  approvalId: string,
  processId: string,
  decision: "aprovado" | "reprovado",
  notes: string,
): Promise<{ ok: boolean; error?: string }> {
  const profile = await requireCrmProfile();
  if (await isDemoModeActive()) return { ok: false, error: DEMO_WRITE_BLOCKED_MESSAGE };

  await decideApprovalRecord({
    approvalId,
    processId,
    decision,
    approverId: profile.id,
    notes: notes.trim() || null,
  });
  revalidatePath(`/processos/${processId}`);
  revalidatePath("/processos");
  return { ok: true };
}
