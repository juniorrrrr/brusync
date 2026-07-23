"use server";

import { revalidatePath } from "next/cache";
import { requireCrmProfile } from "@/application/crm/authGuard";
import {
  AUTOMATION_ACTION_TYPES,
  AUTOMATION_CONDITION_TYPES,
  AUTOMATION_TRIGGER_TYPES,
} from "@/domain/automation/types";
import { getDemoWorkflowById, getDemoWorkflows } from "@/lib/demo/mockAutomations";
import { DEMO_PIPELINE_STAGES } from "@/lib/demo/mockSeed";
import {
  createWorkflow,
  deleteWorkflow,
  getWorkflowById,
  listWorkflows,
  updateWorkflow,
} from "@/repositories/automation/workflowsRepository";
import { listPipelineStages } from "@/repositories/crm/pipelineStagesRepository";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type {
  AutomationActionType,
  AutomationConditionType,
  AutomationPriority,
  AutomationStatus,
  AutomationTriggerType,
  AutomationWorkflow,
} from "@/types/automation";
import type { PipelineStage } from "@/types/crm";

export async function getPipelineStageOptions(): Promise<PipelineStage[]> {
  if (await isDemoModeActive()) return DEMO_PIPELINE_STAGES;

  const supabase = await getSupabaseAuthClient();
  return listPipelineStages(supabase);
}

const DEMO_WRITE_BLOCKED_MESSAGE =
  "Ação indisponível em Modo Demonstração — nenhuma escrita é enviada ao banco.";

export async function fetchWorkflows(): Promise<AutomationWorkflow[]> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return getDemoWorkflows();

  const supabase = await getSupabaseAuthClient();
  return listWorkflows(supabase);
}

export async function fetchWorkflowById(id: string): Promise<AutomationWorkflow | null> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return getDemoWorkflowById(id);

  const supabase = await getSupabaseAuthClient();
  return getWorkflowById(supabase, id);
}

export interface WorkflowActionState {
  status: "idle" | "success" | "error";
  message?: string;
}

function readCondition(formData: FormData): {
  conditionType: AutomationConditionType;
  conditionConfig: Record<string, unknown>;
} {
  const conditionType = String(
    formData.get("conditionType") ?? "sempre",
  ) as AutomationConditionType;

  switch (conditionType) {
    case "origem_igual":
      return {
        conditionType,
        conditionConfig: { origin: String(formData.get("conditionOrigin") ?? "") },
      };
    case "score_maior_igual":
      return {
        conditionType,
        conditionConfig: { score: Number(formData.get("conditionScore") ?? 0) },
      };
    case "dias_parado_maior_igual":
      return {
        conditionType,
        conditionConfig: { days: Number(formData.get("conditionDays") ?? 0) },
      };
    case "estagio_igual":
      return {
        conditionType,
        conditionConfig: { stageKey: String(formData.get("conditionStageKey") ?? "") },
      };
    default:
      return { conditionType: "sempre", conditionConfig: {} };
  }
}

function readAction(formData: FormData): {
  actionType: AutomationActionType;
  actionConfig: Record<string, unknown>;
} {
  const actionType = String(formData.get("actionType") ?? "criar_alerta") as AutomationActionType;

  switch (actionType) {
    case "mover_pipeline":
      return {
        actionType,
        actionConfig: { stageKey: String(formData.get("actionStageKey") ?? "") },
      };
    case "criar_tarefa":
      return {
        actionType,
        actionConfig: {
          title: String(formData.get("actionTitle") ?? ""),
          priority: String(formData.get("actionPriority") ?? "medium"),
        },
      };
    case "criar_alerta":
      return { actionType, actionConfig: { message: String(formData.get("actionMessage") ?? "") } };
    default:
      return { actionType, actionConfig: {} };
  }
}

function readTrigger(formData: FormData): {
  triggerType: AutomationTriggerType;
  triggerConfig: Record<string, unknown>;
} {
  const triggerType = String(
    formData.get("triggerType") ?? "lead_created",
  ) as AutomationTriggerType;

  if (triggerType === "lead_stalled") {
    return { triggerType, triggerConfig: { days: Number(formData.get("triggerDays") ?? 3) } };
  }
  return { triggerType, triggerConfig: {} };
}

export async function saveWorkflowAction(
  _prevState: WorkflowActionState,
  formData: FormData,
): Promise<WorkflowActionState> {
  const profile = await requireCrmProfile();
  if (await isDemoModeActive()) return { status: "error", message: DEMO_WRITE_BLOCKED_MESSAGE };

  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { status: "error", message: "Informe um nome para a automação." };

  const description = String(formData.get("description") ?? "").trim();
  const status = (formData.get("status") === "on" ? "ativo" : "inativo") as AutomationStatus;
  const priority = String(formData.get("priority") ?? "media") as AutomationPriority;

  const { conditionType, conditionConfig } = readCondition(formData);
  const { actionType, actionConfig } = readAction(formData);
  const { triggerType, triggerConfig } = readTrigger(formData);

  if (!AUTOMATION_TRIGGER_TYPES.includes(triggerType)) {
    return { status: "error", message: "Gatilho inválido." };
  }
  if (!AUTOMATION_CONDITION_TYPES.includes(conditionType)) {
    return { status: "error", message: "Condição inválida." };
  }
  if (!AUTOMATION_ACTION_TYPES.includes(actionType)) {
    return { status: "error", message: "Ação inválida." };
  }

  const supabase = await getSupabaseAuthClient();

  if (id) {
    await updateWorkflow(supabase, id, {
      name,
      description: description || null,
      status,
      priority,
      conditionType,
      conditionConfig,
      actionType,
      actionConfig,
      triggerType,
      triggerConfig,
    });
  } else {
    await createWorkflow(supabase, {
      name,
      description: description || null,
      status,
      priority,
      conditionType,
      conditionConfig,
      actionType,
      actionConfig,
      triggerType,
      triggerConfig,
      createdBy: profile.id,
    });
  }

  revalidatePath("/automacoes/lista");
  revalidatePath("/automacoes");
  return { status: "success", message: id ? "Automação atualizada." : "Automação criada." };
}

export async function toggleWorkflowStatusAction(
  id: string,
  nextStatus: AutomationStatus,
): Promise<{ ok: boolean; error?: string }> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return { ok: false, error: DEMO_WRITE_BLOCKED_MESSAGE };

  const supabase = await getSupabaseAuthClient();
  await updateWorkflow(supabase, id, { status: nextStatus });
  revalidatePath("/automacoes/lista");
  revalidatePath("/automacoes");
  return { ok: true };
}

export async function deleteWorkflowAction(id: string): Promise<{ ok: boolean; error?: string }> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return { ok: false, error: DEMO_WRITE_BLOCKED_MESSAGE };

  const supabase = await getSupabaseAuthClient();
  await deleteWorkflow(supabase, id);
  revalidatePath("/automacoes/lista");
  revalidatePath("/automacoes");
  return { ok: true };
}
