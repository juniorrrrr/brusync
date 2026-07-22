import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createActivity } from "@/repositories/crm/activitiesRepository";
import { createClient, getClientBySourceLeadId } from "@/repositories/crm/clientsRepository";
import { createTask } from "@/repositories/crm/tasksRepository";
import type { CrmLeadWithRelations, PipelineStage } from "@/types/crm";

interface StageAutomationRule {
  taskTitle: string;
  dueInDays: number;
}

/** One fixed rule per stage key — no configuration screen in this phase, per
 * the brief's examples (Novo → primeiro contato, Contato Inicial → lembrete,
 * Qualificado → orçamento, Proposta → follow-up). Keyed by pipeline_stages.key
 * so it keeps working even though stage ids are generated per-environment. */
const STAGE_AUTOMATION_RULES: Record<string, StageAutomationRule | undefined> = {
  novo: { taskTitle: "Fazer primeiro contato", dueInDays: 1 },
  contato: { taskTitle: "Lembrete: acompanhar contato inicial", dueInDays: 2 },
  qualificado: { taskTitle: "Preparar orçamento", dueInDays: 2 },
  proposta: { taskTitle: "Follow-up da proposta enviada", dueInDays: 3 },
};

/** Runs whenever a lead enters a stage — on creation (initial stage) and on
 * every stage change. Creates the stage's automatic task (if any) and, when
 * the stage is the "won" one, auto-creates the linked Client the first time
 * (idempotent: checks for an existing client before creating another). */
export async function runStageEntryAutomation(
  supabase: SupabaseClient,
  params: {
    crmLeadId: string;
    stage: PipelineStage;
    lead: Pick<CrmLeadWithRelations, "name" | "company" | "email" | "phone" | "ownerId">;
    actorProfileId: string;
  },
): Promise<void> {
  const { crmLeadId, stage, lead, actorProfileId } = params;

  const rule = STAGE_AUTOMATION_RULES[stage.key];
  if (rule) {
    const dueAt = new Date();
    dueAt.setDate(dueAt.getDate() + rule.dueInDays);

    await createTask(supabase, {
      crmLeadId,
      title: rule.taskTitle,
      priority: "medium",
      dueAt: dueAt.toISOString(),
      assigneeId: lead.ownerId ?? undefined,
      createdBy: actorProfileId,
    });

    await createActivity(supabase, {
      crmLeadId,
      type: "automation",
      title: `Automação: tarefa "${rule.taskTitle}" criada ao entrar em ${stage.label}`,
      createdBy: actorProfileId,
    });
  }

  if (stage.isWon) {
    const existingClient = await getClientBySourceLeadId(supabase, crmLeadId);
    if (!existingClient) {
      await createClient(supabase, {
        company: lead.company || lead.name,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        ownerId: lead.ownerId,
        status: "ativo",
        sourceCrmLeadId: crmLeadId,
        createdBy: actorProfileId,
      });

      await createActivity(supabase, {
        crmLeadId,
        type: "client_created",
        title: "Cliente criado automaticamente",
        createdBy: actorProfileId,
      });
    }
  }
}
