import type {
  OperationsCardKey,
  OperationsCardSeverity,
  OperationsModuleKey,
  OperationsPriority,
} from "@/types/operations";

export const OPERATIONS_CARD_LABEL: Record<OperationsCardKey, string> = {
  leads_aguardando_contato: "Leads aguardando contato",
  leads_atrasados: "Leads atrasados",
  followups_vencidos: "Follow-ups vencidos",
  reunioes_hoje: "Reuniões de hoje",
  projetos_atrasados: "Projetos atrasados",
  projetos_proximos_prazo: "Projetos próximos do prazo",
  clientes_aguardando_retorno: "Clientes aguardando retorno",
  financeiro_vencendo_hoje: "Financeiro vencendo hoje",
  parcelas_atraso: "Parcelas em atraso",
  conversoes_pendentes: "Conversões pendentes",
  integracoes_erro: "Integrações com erro",
  automacoes_falhando: "Automações falhando",
  mensagens_nao_respondidas: "Mensagens não respondidas",
  alertas_criticos: "Alertas críticos",
  insights_novos: "Insights novos",
};

export const OPERATIONS_CARD_HREF: Record<OperationsCardKey, string> = {
  leads_aguardando_contato: "/leads",
  leads_atrasados: "/leads",
  followups_vencidos: "/agenda",
  reunioes_hoje: "/agenda",
  projetos_atrasados: "/projetos",
  projetos_proximos_prazo: "/projetos",
  clientes_aguardando_retorno: "/comunicacao",
  financeiro_vencendo_hoje: "/financeiro/lancamentos",
  parcelas_atraso: "/financeiro/lancamentos",
  conversoes_pendentes: "/conversoes",
  integracoes_erro: "/integracoes/saude",
  automacoes_falhando: "/automacoes/logs",
  mensagens_nao_respondidas: "/comunicacao",
  alertas_criticos: "/inteligencia",
  insights_novos: "/inteligencia",
};

/** A card's severity is a function of its count and what kind of thing it
 * counts — zero is always "ok", but not every card escalates to "critico"
 * at the same threshold (a handful of stale leads is business as usual,
 * any integration error is not). */
const CRITICAL_AT_ANY_COUNT: OperationsCardKey[] = [
  "integracoes_erro",
  "automacoes_falhando",
  "alertas_criticos",
  "parcelas_atraso",
];

export function operationsCardSeverity(
  key: OperationsCardKey,
  value: number,
): OperationsCardSeverity {
  if (value === 0) return "ok";
  if (CRITICAL_AT_ANY_COUNT.includes(key)) return "critico";
  if (value >= 10) return "atencao";
  return "info";
}

export function operationsCardBadge(severity: OperationsCardSeverity): string {
  switch (severity) {
    case "critico":
      return "danger";
    case "atencao":
      return "warn";
    case "ok":
      return "ok";
    default:
      return "info";
  }
}

export const OPERATIONS_MODULE_LABEL: Record<OperationsModuleKey, string> = {
  crm: "CRM",
  marketing: "Marketing",
  financeiro: "Financeiro",
  projetos: "Projetos",
  agenda: "Agenda",
  comunicacao: "Comunicação",
  integracoes: "Integrações",
  automacoes: "Automações",
  conhecimento: "Base de Conhecimento",
};

export const OPERATIONS_MODULE_HREF: Record<OperationsModuleKey, string> = {
  crm: "/dashboard",
  marketing: "/marketing",
  financeiro: "/financeiro",
  projetos: "/projetos",
  agenda: "/agenda",
  comunicacao: "/comunicacao",
  integracoes: "/integracoes/saude",
  automacoes: "/automacoes",
  conhecimento: "/base-conhecimento",
};

export function operationsPriorityBadge(priority: OperationsPriority): string {
  switch (priority) {
    case "alta":
      return "danger";
    case "media":
      return "warn";
    default:
      return "info";
  }
}
