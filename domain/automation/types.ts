import type {
  AutomationActionType,
  AutomationConditionType,
  AutomationExecutionStatus,
  AutomationLogLevel,
  AutomationPriority,
  AutomationStatus,
  AutomationTriggerType,
} from "@/types/automation";
import type { BadgeTone } from "@/types/crm";

export const AUTOMATION_STATUS_LABEL: Record<AutomationStatus, string> = {
  ativo: "Ativo",
  inativo: "Inativo",
};

export const AUTOMATION_STATUS_BADGE: Record<AutomationStatus, BadgeTone> = {
  ativo: "ok",
  inativo: "neutral",
};

export const AUTOMATION_PRIORITY_LABEL: Record<AutomationPriority, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
};

export const AUTOMATION_PRIORITY_BADGE: Record<AutomationPriority, BadgeTone> = {
  baixa: "neutral",
  media: "info",
  alta: "warn",
};

export const AUTOMATION_TRIGGER_LABEL: Record<AutomationTriggerType, string> = {
  lead_created: "Quando um Lead entrar",
  lead_qualified: "Quando um Lead virar Qualificado",
  lead_stalled: "Quando um Lead ficar parado por X dias",
  lead_lost: "Quando um Lead for perdido",
  client_created: "Quando um Cliente for criado",
};

export const AUTOMATION_CONDITION_LABEL: Record<AutomationConditionType, string> = {
  sempre: "Sempre executar",
  origem_igual: "Origem do lead é igual a",
  score_maior_igual: "Score do lead é maior ou igual a",
  dias_parado_maior_igual: "Dias sem interação é maior ou igual a",
  estagio_igual: "Estágio do lead é igual a",
};

export const AUTOMATION_ACTION_LABEL: Record<AutomationActionType, string> = {
  mover_pipeline: "Enviar para determinado Pipeline",
  criar_tarefa: "Criar tarefa automaticamente",
  criar_alerta: "Criar alerta",
  solicitar_motivo_perda: "Solicitar motivo da perda",
  criar_onboarding: "Criar onboarding automaticamente",
};

export const AUTOMATION_EXECUTION_STATUS_LABEL: Record<AutomationExecutionStatus, string> = {
  sucesso: "Sucesso",
  condicao_nao_atendida: "Condição não atendida",
  erro: "Erro",
};

export const AUTOMATION_EXECUTION_STATUS_BADGE: Record<AutomationExecutionStatus, BadgeTone> = {
  sucesso: "ok",
  condicao_nao_atendida: "neutral",
  erro: "danger",
};

export const AUTOMATION_LOG_LEVEL_LABEL: Record<AutomationLogLevel, string> = {
  info: "Info",
  aviso: "Aviso",
  erro: "Erro",
};

export const AUTOMATION_LOG_LEVEL_BADGE: Record<AutomationLogLevel, BadgeTone> = {
  info: "info",
  aviso: "warn",
  erro: "danger",
};

export const AUTOMATION_TRIGGER_TYPES: AutomationTriggerType[] = [
  "lead_created",
  "lead_qualified",
  "lead_stalled",
  "lead_lost",
  "client_created",
];

export const AUTOMATION_CONDITION_TYPES: AutomationConditionType[] = [
  "sempre",
  "origem_igual",
  "score_maior_igual",
  "dias_parado_maior_igual",
  "estagio_igual",
];

export const AUTOMATION_ACTION_TYPES: AutomationActionType[] = [
  "mover_pipeline",
  "criar_tarefa",
  "criar_alerta",
  "solicitar_motivo_perda",
  "criar_onboarding",
];
