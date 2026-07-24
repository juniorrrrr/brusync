/** Friendly labels for the well-known `integration_logs.event` values this
 * phase introduces — the History timeline (LogsTimeline) falls back to the
 * raw event string for anything not in this map (e.g. Meta's own
 * conversion-type event names), same graceful-fallback pattern used for
 * ACTIVITY_TYPE_LABEL elsewhere in the app. */
export const INTEGRATION_LOG_EVENT_LABEL: Record<string, string> = {
  conexao_criada: "Conexão criada",
  conexao_editada: "Conexão editada",
  conexao_removida: "Conexão removida",
  teste_executado: "Teste de conexão executado",
  erro_autenticacao: "Erro de autenticação",
  reconexao: "Reconexão",
  ativada: "Integração ativada",
  desativada: "Integração desativada",
};

export function integrationLogEventLabel(event: string): string {
  return INTEGRATION_LOG_EVENT_LABEL[event] ?? event;
}

/** The one honest message every "Testar conexão" click must show for a
 * provider with no real implementation yet — never simulate success. */
export const CONNECTION_NOT_IMPLEMENTED_MESSAGE =
  "Integração preparada. A conexão será validada quando esta integração for implementada.";
