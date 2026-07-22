"use server";

import { revalidatePath } from "next/cache";
import { requireCrmProfile } from "@/application/crm/authGuard";
import {
  getLeadDetailData,
  getOwnerOptions,
  type LeadDetailData,
} from "@/application/crm/leadsQueries";
import { createActivity } from "@/repositories/crm/activitiesRepository";
import {
  deleteLeadFile,
  getFileSignedUrl,
  listFilesForLead,
  uploadLeadFile,
} from "@/repositories/crm/filesRepository";
import {
  bulkUpdateLeads,
  createLead,
  deleteLead,
  getLeadById,
  touchLeadInteraction,
  updateLead,
  updateLeadStage,
} from "@/repositories/crm/leadsRepository";
import { listPipelineStages } from "@/repositories/crm/pipelineStagesRepository";
import { validateLeadFile } from "@/schemas/crm/file.schema";
import {
  bulkUpdateLeadsSchema,
  createLeadSchema,
  moveLeadStageSchema,
  updateLeadSchema,
} from "@/schemas/crm/lead.schema";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type { LeadFile } from "@/types/crm";

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

export async function fetchOwnerOptions() {
  await requireCrmProfile();
  return getOwnerOptions();
}

export async function createLeadAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const profile = await requireCrmProfile();

  const parsed = createLeadSchema.safeParse({
    name: formData.get("name"),
    company: formData.get("company") || undefined,
    jobTitle: formData.get("jobTitle") || undefined,
    city: formData.get("city") || undefined,
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
    jobTitle: parsed.data.jobTitle || null,
    city: parsed.data.city || null,
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
  const profile = await requireCrmProfile();

  const parsed = updateLeadSchema.safeParse({
    leadId: formData.get("leadId"),
    name: formData.get("name") || undefined,
    company: formData.get("company") || undefined,
    jobTitle: formData.get("jobTitle") || undefined,
    city: formData.get("city") || undefined,
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

  const before = await getLeadById(supabase, leadId);
  if (!before) return { status: "error", message: "Lead não encontrado." };

  await updateLead(supabase, leadId, patch);

  if (patch.ownerId !== undefined && patch.ownerId !== before.ownerId) {
    await createActivity(supabase, {
      crmLeadId: leadId,
      type: "owner_change",
      title: "Responsável alterado",
      createdBy: profile.id,
    });
  } else {
    await createActivity(supabase, {
      crmLeadId: leadId,
      type: "lead_updated",
      title: "Lead editado",
      createdBy: profile.id,
    });
  }

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

export async function deleteLeadAction(leadId: string): Promise<{ ok: boolean; error?: string }> {
  await requireCrmProfile();
  const supabase = await getSupabaseAuthClient();
  await deleteLead(supabase, leadId);

  revalidatePath("/leads");
  revalidatePath("/pipeline");
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

/** Fetched lazily, the first time the Arquivos tab is opened. */
export async function fetchLeadFiles(crmLeadId: string): Promise<LeadFile[]> {
  await requireCrmProfile();
  const supabase = await getSupabaseAuthClient();
  return listFilesForLead(supabase, crmLeadId);
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
  await createActivity(supabase, {
    crmLeadId,
    type: "file_upload",
    title: `Arquivo enviado: ${file.name}`,
    createdBy: profile.id,
  });
  await touchLeadInteraction(supabase, crmLeadId);

  revalidatePath("/leads");

  return { status: "success", message: "Arquivo enviado." };
}

export async function deleteLeadFileAction(
  fileId: string,
  storagePath: string,
  crmLeadId: string,
  fileName: string,
): Promise<{ ok: boolean; error?: string }> {
  const profile = await requireCrmProfile();
  const supabase = await getSupabaseAuthClient();
  await deleteLeadFile(supabase, fileId, storagePath);
  await createActivity(supabase, {
    crmLeadId,
    type: "file_delete",
    title: `Arquivo removido: ${fileName}`,
    createdBy: profile.id,
  });

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
