"use server";

import { revalidatePath } from "next/cache";
import { requireCrmProfile } from "@/application/crm/authGuard";
import { getLeadDetailData, type LeadDetailData } from "@/application/crm/leadsQueries";
import {
  createActivity,
  toggleTaskDone as toggleTaskDoneRepo,
} from "@/repositories/crm/activitiesRepository";
import {
  deleteLeadFile,
  getFileSignedUrl,
  uploadLeadFile,
} from "@/repositories/crm/filesRepository";
import {
  bulkUpdateLeads,
  createLead,
  touchLeadInteraction,
  updateLead,
  updateLeadStage,
} from "@/repositories/crm/leadsRepository";
import { listPipelineStages } from "@/repositories/crm/pipelineStagesRepository";
import { createActivitySchema, toggleTaskDoneSchema } from "@/schemas/crm/activity.schema";
import { validateLeadFile } from "@/schemas/crm/file.schema";
import {
  bulkUpdateLeadsSchema,
  createLeadSchema,
  moveLeadStageSchema,
  updateLeadSchema,
} from "@/schemas/crm/lead.schema";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";

export interface ActionState {
  status: "idle" | "success" | "error";
  message?: string;
}

function firstIssueMessage(error: { issues: { message: string }[] }) {
  return error.issues[0]?.message ?? "Dados inválidos.";
}

export async function fetchLeadDetail(leadId: string): Promise<LeadDetailData | null> {
  await requireCrmProfile();
  return getLeadDetailData(leadId);
}

export async function createLeadAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const profile = await requireCrmProfile();

  const parsed = createLeadSchema.safeParse({
    name: formData.get("name"),
    company: formData.get("company") || undefined,
    email: formData.get("email") || undefined,
    phone: formData.get("phone") || undefined,
    origin: formData.get("origin") || undefined,
    ownerId: formData.get("ownerId") || undefined,
    potentialValue: formData.get("potentialValue") || undefined,
  });

  if (!parsed.success) {
    return { status: "error", message: firstIssueMessage(parsed.error) };
  }

  const supabase = await getSupabaseAuthClient();
  const stages = await listPipelineStages(supabase);
  const firstStage = stages.find((stage) => stage.position === 1) ?? stages[0];
  if (!firstStage) {
    return { status: "error", message: "Nenhum estágio de pipeline configurado." };
  }

  const lead = await createLead(supabase, {
    name: parsed.data.name,
    company: parsed.data.company || null,
    email: parsed.data.email || null,
    phone: parsed.data.phone || null,
    origin: parsed.data.origin || null,
    stageId: firstStage.id,
    ownerId: parsed.data.ownerId || null,
    potentialValue: parsed.data.potentialValue ?? null,
    createdBy: profile.id,
  });

  await createActivity(supabase, {
    crmLeadId: lead.id,
    type: "system",
    title: "Lead criado",
    createdBy: profile.id,
  });

  revalidatePath("/leads");
  revalidatePath("/pipeline");
  revalidatePath("/dashboard");

  return { status: "success", message: "Lead criado com sucesso." };
}

export async function updateLeadAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireCrmProfile();

  const parsed = updateLeadSchema.safeParse({
    leadId: formData.get("leadId"),
    name: formData.get("name") || undefined,
    company: formData.get("company") || undefined,
    email: formData.get("email") || undefined,
    phone: formData.get("phone") || undefined,
    origin: formData.get("origin") || undefined,
    ownerId: formData.get("ownerId") || undefined,
    potentialValue: formData.get("potentialValue") || undefined,
    score: formData.get("score") || undefined,
    tags: formData.get("tags")
      ? String(formData.get("tags"))
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : undefined,
  });

  if (!parsed.success) {
    return { status: "error", message: firstIssueMessage(parsed.error) };
  }

  const supabase = await getSupabaseAuthClient();
  const { leadId, ...patch } = parsed.data;
  await updateLead(supabase, leadId, patch);

  revalidatePath("/leads");
  revalidatePath("/pipeline");

  return { status: "success", message: "Lead atualizado." };
}

export async function moveLeadStageAction(
  leadId: string,
  stageId: string,
): Promise<{ ok: boolean; error?: string }> {
  const profile = await requireCrmProfile();
  const parsed = moveLeadStageSchema.safeParse({ leadId, stageId });
  if (!parsed.success) return { ok: false, error: firstIssueMessage(parsed.error) };

  const supabase = await getSupabaseAuthClient();
  const stages = await listPipelineStages(supabase);
  const targetStage = stages.find((stage) => stage.id === stageId);
  if (!targetStage) return { ok: false, error: "Estágio inválido." };

  await updateLeadStage(supabase, leadId, stageId);
  await createActivity(supabase, {
    crmLeadId: leadId,
    type: "stage_change",
    title: `Movido para ${targetStage.label}`,
    createdBy: profile.id,
  });

  revalidatePath("/pipeline");
  revalidatePath("/leads");
  revalidatePath("/dashboard");

  return { ok: true };
}

export async function bulkUpdateLeadsAction(
  leadIds: string[],
  patch: { stageId?: string; ownerId?: string },
): Promise<{ ok: boolean; error?: string }> {
  await requireCrmProfile();
  const parsed = bulkUpdateLeadsSchema.safeParse({ leadIds, ...patch });
  if (!parsed.success) return { ok: false, error: firstIssueMessage(parsed.error) };

  const supabase = await getSupabaseAuthClient();
  await bulkUpdateLeads(supabase, parsed.data.leadIds, {
    stageId: parsed.data.stageId,
    ownerId: parsed.data.ownerId,
  });

  revalidatePath("/leads");
  revalidatePath("/pipeline");

  return { ok: true };
}

export async function addActivityAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const profile = await requireCrmProfile();

  const dueAtRaw = formData.get("dueAt");
  const parsed = createActivitySchema.safeParse({
    crmLeadId: formData.get("crmLeadId"),
    type: formData.get("type"),
    title: formData.get("title"),
    body: formData.get("body") || undefined,
    dueAt: dueAtRaw ? new Date(String(dueAtRaw)).toISOString() : undefined,
  });

  if (!parsed.success) {
    return { status: "error", message: firstIssueMessage(parsed.error) };
  }

  const supabase = await getSupabaseAuthClient();
  await createActivity(supabase, { ...parsed.data, createdBy: profile.id });

  if (parsed.data.type !== "task") {
    await touchLeadInteraction(supabase, parsed.data.crmLeadId);
  }

  revalidatePath("/leads");
  revalidatePath("/dashboard");

  return { status: "success", message: "Registrado." };
}

export async function toggleTaskDoneAction(
  activityId: string,
  done: boolean,
): Promise<{ ok: boolean; error?: string }> {
  await requireCrmProfile();
  const parsed = toggleTaskDoneSchema.safeParse({ activityId, done });
  if (!parsed.success) return { ok: false, error: firstIssueMessage(parsed.error) };

  const supabase = await getSupabaseAuthClient();
  await toggleTaskDoneRepo(supabase, parsed.data.activityId, parsed.data.done);

  revalidatePath("/dashboard");
  return { ok: true };
}

export async function uploadLeadFileAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const profile = await requireCrmProfile();

  const crmLeadId = String(formData.get("crmLeadId") ?? "");
  const file = formData.get("file");

  if (!crmLeadId || !(file instanceof File) || file.size === 0) {
    return { status: "error", message: "Selecione um arquivo." };
  }

  const validationError = validateLeadFile(file);
  if (validationError) {
    return { status: "error", message: validationError };
  }

  const supabase = await getSupabaseAuthClient();
  await uploadLeadFile(supabase, { crmLeadId, file, uploadedBy: profile.id });

  revalidatePath("/leads");

  return { status: "success", message: "Arquivo enviado." };
}

export async function deleteLeadFileAction(
  fileId: string,
  storagePath: string,
): Promise<{ ok: boolean; error?: string }> {
  await requireCrmProfile();
  const supabase = await getSupabaseAuthClient();
  await deleteLeadFile(supabase, fileId, storagePath);
  revalidatePath("/leads");
  return { ok: true };
}

export async function getFileDownloadUrlAction(
  storagePath: string,
): Promise<{ url: string | null; error?: string }> {
  await requireCrmProfile();
  try {
    const supabase = await getSupabaseAuthClient();
    const url = await getFileSignedUrl(supabase, storagePath, 60);
    return { url };
  } catch (err) {
    return { url: null, error: err instanceof Error ? err.message : "Falha ao gerar link." };
  }
}
