import { DEMO_LEADS } from "@/lib/demo/mockSeed";
import type {
  AutomationExecution,
  AutomationExecutionStatus,
  AutomationHealth,
  AutomationLogEntry,
  AutomationWorkflow,
} from "@/types/automation";

/** Fictitious workflows for "Modo Demonstração" — one per example given in
 * the Fase 10 spec, so the Lista/Dashboard screens always have something
 * realistic to show even before a single real automation is created. */
export const DEMO_WORKFLOWS: AutomationWorkflow[] = [
  {
    id: "00000000-a010-4000-8000-000000000001",
    name: "Novo lead direto para Qualificação",
    description: "Quando um lead entra pelo site, já envia direto para o estágio Qualificado.",
    status: "ativo",
    priority: "alta",
    conditionType: "origem_igual",
    conditionConfig: { origin: "Site" },
    actionType: "mover_pipeline",
    actionConfig: { stageKey: "qualificado" },
    trigger: { triggerType: "lead_created", triggerConfig: {} },
    createdAt: "2026-06-02T13:00:00.000Z",
    updatedAt: "2026-06-02T13:00:00.000Z",
    createdBy: null,
  },
  {
    id: "00000000-a010-4000-8000-000000000002",
    name: "Tarefa automática de qualificação",
    description: "Cria uma tarefa de follow-up assim que o lead vira Qualificado.",
    status: "ativo",
    priority: "media",
    conditionType: "sempre",
    conditionConfig: {},
    actionType: "criar_tarefa",
    actionConfig: { title: "Ligar para o lead qualificado", priority: "high" },
    trigger: { triggerType: "lead_qualified", triggerConfig: {} },
    createdAt: "2026-06-05T09:30:00.000Z",
    updatedAt: "2026-06-05T09:30:00.000Z",
    createdBy: null,
  },
  {
    id: "00000000-a010-4000-8000-000000000003",
    name: "Alerta de lead parado",
    description: "Avisa o time quando um lead fica mais de 5 dias sem interação.",
    status: "ativo",
    priority: "media",
    conditionType: "dias_parado_maior_igual",
    conditionConfig: { days: 5 },
    actionType: "criar_alerta",
    actionConfig: { message: "Lead sem interação há mais de 5 dias — revisar prioridade." },
    trigger: { triggerType: "lead_stalled", triggerConfig: { days: 5 } },
    createdAt: "2026-06-10T16:20:00.000Z",
    updatedAt: "2026-06-10T16:20:00.000Z",
    createdBy: null,
  },
  {
    id: "00000000-a010-4000-8000-000000000004",
    name: "Motivo obrigatório na perda",
    description: "Sempre que um lead é perdido, cria uma tarefa para registrar o motivo.",
    status: "ativo",
    priority: "alta",
    conditionType: "sempre",
    conditionConfig: {},
    actionType: "solicitar_motivo_perda",
    actionConfig: {},
    trigger: { triggerType: "lead_lost", triggerConfig: {} },
    createdAt: "2026-06-14T11:10:00.000Z",
    updatedAt: "2026-06-14T11:10:00.000Z",
    createdBy: null,
  },
  {
    id: "00000000-a010-4000-8000-000000000005",
    name: "Onboarding automático de cliente",
    description: "Cria a tarefa de onboarding assim que um cliente novo é criado.",
    status: "inativo",
    priority: "baixa",
    conditionType: "sempre",
    conditionConfig: {},
    actionType: "criar_onboarding",
    actionConfig: {},
    trigger: { triggerType: "client_created", triggerConfig: {} },
    createdAt: "2026-06-18T08:45:00.000Z",
    updatedAt: "2026-06-20T10:00:00.000Z",
    createdBy: null,
  },
];

const RESULT_MESSAGE_BY_ACTION: Record<string, string> = {
  mover_pipeline: 'Lead movido para o estágio "Qualificado".',
  criar_tarefa: 'Tarefa "Ligar para o lead qualificado" criada.',
  criar_alerta: "Alerta registrado na timeline do lead.",
  solicitar_motivo_perda: "Tarefa de motivo da perda criada.",
  criar_onboarding: "Tarefa de onboarding criada.",
};

function outcomeFor(seed: string): AutomationExecutionStatus {
  const code = seed.charCodeAt(seed.length - 1) % 10;
  if (code === 0) return "erro";
  if (code <= 2) return "condicao_nao_atendida";
  return "sucesso";
}

interface DemoExecutionSeed {
  execution: AutomationExecution;
}

function buildDemoExecutions(): DemoExecutionSeed[] {
  const items: DemoExecutionSeed[] = [];
  let counter = 0;

  for (const workflow of DEMO_WORKFLOWS) {
    if (workflow.status !== "ativo") continue;

    for (const lead of DEMO_LEADS) {
      counter += 1;
      const id = `00000000-a011-4000-8000-${String(counter).padStart(6, "0")}${workflow.id.slice(-6)}`;
      const status = outcomeFor(`${workflow.id}${lead.id}`);
      const executedAt = new Date(
        Date.now() - ((counter * 7) % 14) * 24 * 60 * 60 * 1000 - counter * 60_000,
      ).toISOString();

      const resultMessage =
        status === "sucesso"
          ? (RESULT_MESSAGE_BY_ACTION[workflow.actionType] ?? "Ação executada.")
          : status === "condicao_nao_atendida"
            ? "Condição não atendida para este lead."
            : "Falha ao executar a ação configurada.";

      items.push({
        execution: {
          id,
          workflowId: workflow.id,
          workflowName: workflow.name,
          crmLeadId: lead.id,
          leadName: lead.name,
          triggerType: workflow.trigger?.triggerType ?? "lead_created",
          status,
          resultMessage,
          durationMs: 40 + ((counter * 13) % 260),
          executedAt,
        },
      });
    }
  }

  return items.sort((a, b) => b.execution.executedAt.localeCompare(a.execution.executedAt));
}

export function getDemoWorkflows(): AutomationWorkflow[] {
  return DEMO_WORKFLOWS;
}

export function getDemoWorkflowById(id: string): AutomationWorkflow | null {
  return DEMO_WORKFLOWS.find((w) => w.id === id) ?? null;
}

export interface DemoExecutionsOptions {
  workflowId?: string;
  status?: AutomationExecutionStatus;
  triggerType?: string;
  limit?: number;
  offset?: number;
}

export function getDemoExecutions(options: DemoExecutionsOptions = {}): {
  executions: AutomationExecution[];
  total: number;
} {
  let executions = buildDemoExecutions().map((item) => item.execution);

  if (options.workflowId)
    executions = executions.filter((e) => e.workflowId === options.workflowId);
  if (options.status) executions = executions.filter((e) => e.status === options.status);
  if (options.triggerType)
    executions = executions.filter((e) => e.triggerType === options.triggerType);

  const total = executions.length;
  const offset = options.offset ?? 0;
  const limit = options.limit ?? 50;
  return { executions: executions.slice(offset, offset + limit), total };
}

export interface DemoLogsOptions {
  workflowId?: string;
  level?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export function getDemoLogs(options: DemoLogsOptions = {}): {
  logs: AutomationLogEntry[];
  total: number;
} {
  const executions = buildDemoExecutions().map((item) => item.execution);

  let logs: AutomationLogEntry[] = executions.map((execution) => ({
    id: `${execution.id}-log`,
    workflowId: execution.workflowId,
    workflowName: execution.workflowName,
    executionId: execution.id,
    level: execution.status === "erro" ? "erro" : execution.status === "sucesso" ? "info" : "aviso",
    message: execution.resultMessage ?? "Automação processada.",
    metadata: { crmLeadId: execution.crmLeadId, leadName: execution.leadName },
    createdAt: execution.executedAt,
  }));

  if (options.workflowId) logs = logs.filter((l) => l.workflowId === options.workflowId);
  if (options.level) logs = logs.filter((l) => l.level === options.level);
  if (options.search) {
    const term = options.search.toLowerCase();
    logs = logs.filter((l) => l.message.toLowerCase().includes(term));
  }

  const total = logs.length;
  const offset = options.offset ?? 0;
  const limit = options.limit ?? 50;
  return { logs: logs.slice(offset, offset + limit), total };
}

export function getDemoAutomationHealth(): AutomationHealth {
  const { executions } = getDemoExecutions({ limit: 10_000 });
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const today = executions.filter((e) => new Date(e.executedAt) >= startOfDay);
  const evaluated = executions.filter((e) => e.status !== "condicao_nao_atendida");
  const success = evaluated.filter((e) => e.status === "sucesso").length;

  return {
    activeWorkflows: DEMO_WORKFLOWS.filter((w) => w.status === "ativo").length,
    executionsToday: today.length,
    successRate: evaluated.length > 0 ? (success / evaluated.length) * 100 : null,
    averageDurationMs:
      executions.length > 0
        ? Math.round(executions.reduce((sum, e) => sum + e.durationMs, 0) / executions.length)
        : null,
    failuresToday: today.filter((e) => e.status === "erro").length,
  };
}
