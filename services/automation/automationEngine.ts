import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { evaluateCondition, type LeadConditionSnapshot } from "@/domain/automation/condition";
import { EVENT_TYPE_TO_AUTOMATION_TRIGGER } from "@/domain/automation/eventMap";
import type { EventType } from "@/domain/events/types";
import { createExecution, hasExecutionSince } from "@/repositories/automation/executionsRepository";
import { createLog } from "@/repositories/automation/logsRepository";
import { listActiveTriggerBindings } from "@/repositories/automation/triggersRepository";
import {
  getWorkflowById,
  listActiveWorkflowsForTrigger,
} from "@/repositories/automation/workflowsRepository";
import { createActivity } from "@/repositories/crm/activitiesRepository";
import { getClientById } from "@/repositories/crm/clientsRepository";
import { getLeadById, updateLeadStage } from "@/repositories/crm/leadsRepository";
import { listPipelineStages } from "@/repositories/crm/pipelineStagesRepository";
import { createTask } from "@/repositories/crm/tasksRepository";
import { isDemoModeActive } from "@/services/demo/demoMode";
import type { AutomationTriggerType, AutomationWorkflow } from "@/types/automation";
import type { CrmLeadWithRelations } from "@/types/crm";

const NEUTRAL_SNAPSHOT: LeadConditionSnapshot = {
  origin: null,
  score: 0,
  stageKey: null,
  daysSinceInteraction: null,
};

function buildSnapshot(lead: CrmLeadWithRelations): LeadConditionSnapshot {
  const reference = lead.lastInteractionAt ?? lead.createdAt;
  const daysSinceInteraction = Math.floor(
    (Date.now() - new Date(reference).getTime()) / (24 * 60 * 60 * 1000),
  );

  return {
    origin: lead.origin,
    score: lead.score,
    stageKey: lead.stage.key,
    daysSinceInteraction,
  };
}

interface ActionResult {
  ok: boolean;
  message: string;
}

/** The "AÇÃO" step — the only place that actually mutates CRM data on
 * behalf of an automation. Every action reuses an existing, already-tested
 * repository function (the same ones the Lead Workspace UI itself calls),
 * matching Fase 9's "reaproveitar arquitetura anterior, não criar atalhos"
 * approach. Never throws — every branch returns a result, success or not. */
async function executeAction(
  supabase: SupabaseClient,
  workflow: AutomationWorkflow,
  crmLeadId: string | null,
): Promise<ActionResult> {
  if (!crmLeadId) {
    return { ok: false, message: "Ação requer um lead vinculado, mas nenhum foi encontrado." };
  }

  const config = workflow.actionConfig;

  switch (workflow.actionType) {
    case "mover_pipeline": {
      const stageKey = typeof config.stageKey === "string" ? config.stageKey : "";
      if (!stageKey) return { ok: false, message: "Nenhum estágio de destino configurado." };

      const stages = await listPipelineStages(supabase);
      const target = stages.find((s) => s.key === stageKey);
      if (!target) return { ok: false, message: `Estágio "${stageKey}" não encontrado.` };

      await updateLeadStage(supabase, crmLeadId, target.id);
      return { ok: true, message: `Lead movido para o estágio "${target.label}".` };
    }

    case "criar_tarefa": {
      const title =
        typeof config.title === "string" && config.title ? config.title : "Tarefa automática";
      const priority =
        config.priority === "low" || config.priority === "high" ? config.priority : "medium";

      await createTask(supabase, {
        crmLeadId,
        title,
        priority,
        createdBy: null as unknown as string,
      });
      return { ok: true, message: `Tarefa "${title}" criada.` };
    }

    case "criar_alerta": {
      const message =
        typeof config.message === "string" && config.message
          ? config.message
          : "Alerta gerado automaticamente por uma automação.";

      await createActivity(supabase, {
        crmLeadId,
        type: "system",
        title: "Alerta automático",
        body: message,
        createdBy: null,
      });
      return { ok: true, message: "Alerta registrado na timeline do lead." };
    }

    case "solicitar_motivo_perda": {
      await createTask(supabase, {
        crmLeadId,
        title: "Registrar motivo da perda",
        priority: "high",
        createdBy: null as unknown as string,
      });
      return { ok: true, message: "Tarefa de motivo da perda criada." };
    }

    case "criar_onboarding": {
      await createTask(supabase, {
        crmLeadId,
        title: "Iniciar onboarding do novo cliente",
        priority: "high",
        createdBy: null as unknown as string,
      });
      return { ok: true, message: "Tarefa de onboarding criada." };
    }

    default:
      return { ok: false, message: "Tipo de ação desconhecido." };
  }
}

async function evaluateAndRun(
  supabase: SupabaseClient,
  workflow: AutomationWorkflow,
  triggerType: AutomationTriggerType,
  crmLeadId: string | null,
  snapshot: LeadConditionSnapshot,
): Promise<void> {
  const startedAt = Date.now();

  try {
    const condition = evaluateCondition(workflow.conditionType, workflow.conditionConfig, snapshot);

    if (!condition.passed) {
      const { id: executionId } = await createExecution(supabase, {
        workflowId: workflow.id,
        crmLeadId,
        triggerType,
        status: "condicao_nao_atendida",
        resultMessage: condition.reason,
        durationMs: Date.now() - startedAt,
      });
      await createLog(supabase, {
        workflowId: workflow.id,
        executionId,
        level: "info",
        message: `Condição não atendida: ${condition.reason}`,
      });
      return;
    }

    const result = await executeAction(supabase, workflow, crmLeadId);
    const { id: executionId } = await createExecution(supabase, {
      workflowId: workflow.id,
      crmLeadId,
      triggerType,
      status: result.ok ? "sucesso" : "erro",
      resultMessage: result.message,
      durationMs: Date.now() - startedAt,
    });
    await createLog(supabase, {
      workflowId: workflow.id,
      executionId,
      level: result.ok ? "info" : "erro",
      message: result.message,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Falha inesperada ao executar automação.";
    const { id: executionId } = await createExecution(supabase, {
      workflowId: workflow.id,
      crmLeadId,
      triggerType,
      status: "erro",
      resultMessage: message,
      durationMs: Date.now() - startedAt,
    });
    await createLog(supabase, { workflowId: workflow.id, executionId, level: "erro", message });
  }
}

/** Called from services/eventBus/eventBus.ts right after every event is
 * published — the same subscription point the Conversions Hub (Fase 8) and
 * the Meta dispatcher (Fase 9) use, so no CRM screen or action file needed
 * to change for automations to start reacting to real lifecycle events.
 * Deliberately never throws: a bug here must never break the business
 * action that published the event. */
export async function runAutomationsForEvent(
  supabase: SupabaseClient,
  eventType: EventType,
  payload: Record<string, unknown>,
): Promise<void> {
  if (await isDemoModeActive()) return;

  const triggerType = EVENT_TYPE_TO_AUTOMATION_TRIGGER[eventType];
  if (!triggerType) return;

  try {
    const workflows = await listActiveWorkflowsForTrigger(supabase, triggerType);
    if (workflows.length === 0) return;

    let crmLeadId: string | null = typeof payload.leadId === "string" ? payload.leadId : null;
    let snapshot: LeadConditionSnapshot = NEUTRAL_SNAPSHOT;

    if (crmLeadId) {
      const lead = await getLeadById(supabase, crmLeadId);
      if (lead) snapshot = buildSnapshot(lead);
    } else if (triggerType === "client_created" && typeof payload.clientId === "string") {
      const client = await getClientById(supabase, payload.clientId);
      if (client?.sourceCrmLeadId) {
        crmLeadId = client.sourceCrmLeadId;
        const lead = await getLeadById(supabase, crmLeadId);
        if (lead) snapshot = buildSnapshot(lead);
      }
    }

    for (const workflow of workflows) {
      await evaluateAndRun(supabase, workflow, triggerType, crmLeadId, snapshot);
    }
  } catch (err) {
    console.error(`automationEngine: falha ao processar gatilho ${triggerType}`, err);
  }
}

/** Called from app/api/cron/automation-stalled-check — the only trigger
 * type that isn't event-based, since "parado há X dias" has to be noticed
 * by scanning, not by something happening. Each active "lead_stalled"
 * workflow declares its own threshold in trigger_config.days. */
export async function runStalledLeadCheck(supabase: SupabaseClient): Promise<number> {
  if (await isDemoModeActive()) return 0;

  let evaluated = 0;

  try {
    const bindings = await listActiveTriggerBindings(supabase, "lead_stalled");
    if (bindings.length === 0) return 0;

    const stages = await listPipelineStages(supabase);
    const openStageIds = new Set(stages.filter((s) => !s.isWon).map((s) => s.id));

    for (const binding of bindings) {
      const workflow = await getWorkflowById(supabase, binding.workflowId);
      if (workflow?.status !== "ativo") continue;

      const days = Number(binding.triggerConfig.days ?? 3);
      const staleBefore = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from("crm_leads")
        .select(
          "id, origin, score, stage_id, last_interaction_at, created_at, stage:pipeline_stages!crm_leads_stage_id_fkey (key, is_won)",
        )
        .is("lost_at", null)
        .or(
          `last_interaction_at.lte.${staleBefore},and(last_interaction_at.is.null,created_at.lte.${staleBefore})`,
        );

      if (error) throw new Error(`Falha ao buscar leads parados: ${error.message}`);

      type StalledLeadRow = {
        id: string;
        origin: string | null;
        score: number;
        stage_id: string;
        last_interaction_at: string | null;
        created_at: string;
        stage: { key: string; is_won: boolean } | null;
      };

      for (const row of (data ?? []) as unknown as StalledLeadRow[]) {
        if (!openStageIds.has(row.stage_id)) continue;

        const reference = row.last_interaction_at ?? row.created_at;
        const already = await hasExecutionSince(supabase, workflow.id, row.id, reference);
        if (already) continue;

        const snapshot: LeadConditionSnapshot = {
          origin: row.origin,
          score: row.score,
          stageKey: row.stage?.key ?? null,
          daysSinceInteraction: Math.floor(
            (Date.now() - new Date(reference).getTime()) / (24 * 60 * 60 * 1000),
          ),
        };

        await evaluateAndRun(supabase, workflow, "lead_stalled", row.id, snapshot);
        evaluated += 1;
      }
    }
  } catch (err) {
    console.error("automationEngine: falha na checagem de leads parados", err);
  }

  return evaluated;
}
