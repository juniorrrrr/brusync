export type AutomationStatus = "ativo" | "inativo";

export type AutomationPriority = "baixa" | "media" | "alta";

export type AutomationTriggerType =
  | "lead_created"
  | "lead_qualified"
  | "lead_stalled"
  | "lead_lost"
  | "client_created";

export type AutomationConditionType =
  | "sempre"
  | "origem_igual"
  | "score_maior_igual"
  | "dias_parado_maior_igual"
  | "estagio_igual";

export type AutomationActionType =
  | "mover_pipeline"
  | "criar_tarefa"
  | "criar_alerta"
  | "solicitar_motivo_perda"
  | "criar_onboarding";

export type AutomationExecutionStatus = "sucesso" | "condicao_nao_atendida" | "erro";

export type AutomationLogLevel = "info" | "aviso" | "erro";

export interface AutomationTrigger {
  triggerType: AutomationTriggerType;
  triggerConfig: Record<string, unknown>;
}

export interface AutomationWorkflow {
  id: string;
  name: string;
  description: string | null;
  status: AutomationStatus;
  priority: AutomationPriority;
  conditionType: AutomationConditionType;
  conditionConfig: Record<string, unknown>;
  actionType: AutomationActionType;
  actionConfig: Record<string, unknown>;
  trigger: AutomationTrigger | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
}

export interface AutomationExecution {
  id: string;
  workflowId: string | null;
  workflowName: string | null;
  crmLeadId: string | null;
  leadName: string | null;
  triggerType: AutomationTriggerType;
  status: AutomationExecutionStatus;
  resultMessage: string | null;
  durationMs: number;
  executedAt: string;
}

export interface AutomationLogEntry {
  id: string;
  workflowId: string | null;
  workflowName: string | null;
  executionId: string | null;
  level: AutomationLogLevel;
  message: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface AutomationHealth {
  activeWorkflows: number;
  executionsToday: number;
  successRate: number | null;
  averageDurationMs: number | null;
  failuresToday: number;
}
