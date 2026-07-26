export type AiContextType =
  | "geral"
  | "lead"
  | "cliente"
  | "projeto"
  | "marketing"
  | "comercial"
  | "financeiro"
  | "projetos";

export type AiConversationStatus = "ativa" | "arquivada";

export interface AiConversation {
  id: string;
  title: string;
  contextType: AiContextType;
  contextRef: string | null;
  status: AiConversationStatus;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export type AiMessageRole = "user" | "assistant";

export interface AiMessage {
  id: string;
  conversationId: string;
  role: AiMessageRole;
  content: string;
  isFavorite: boolean;
  createdAt: string;
}

export interface AiConversationDetail extends AiConversation {
  messages: AiMessage[];
}

export interface AiPrompt {
  id: string;
  title: string;
  content: string;
  category: string | null;
  createdBy: string | null;
  createdAt: string;
}

export type AiSuggestionType =
  | "resumo"
  | "proxima_acao"
  | "probabilidade_fechamento"
  | "risco"
  | "movimentacao"
  | "material_recomendado"
  | "projeto_relacionado"
  | "cliente_semelhante"
  | "campanha_baixo_desempenho"
  | "campanha_promissora"
  | "conversao_alta"
  | "cac_alto"
  | "roas_baixo"
  | "lead_esquecido"
  | "lead_sem_contato"
  | "oportunidade"
  | "pipeline_parado"
  | "resumo_comercial"
  | "receita_futura"
  | "cliente_inadimplente"
  | "receita_em_risco"
  | "fluxo_caixa"
  | "alerta_financeiro"
  | "projeto_atrasado"
  | "projeto_sem_responsavel"
  | "tarefa_critica"
  | "carga_equipe";

export type AiSuggestionSeverity = "info" | "atencao" | "critico";

export interface AiSuggestionEvidence {
  label: string;
  value: string;
}

export interface AiSuggestion {
  id: string;
  type: AiSuggestionType;
  module: AiContextType;
  contextRef: string | null;
  title: string;
  content: string;
  severity: AiSuggestionSeverity;
  evidence: AiSuggestionEvidence[];
  isFavorite: boolean;
  createdAt: string;
}

export type AiFeedbackTargetType = "message" | "suggestion";
export type AiFeedbackRating = "positivo" | "negativo";

export interface AiFeedback {
  id: string;
  targetType: AiFeedbackTargetType;
  targetId: string;
  rating: AiFeedbackRating;
  comment: string | null;
  createdBy: string | null;
  createdAt: string;
}

export type AiUsageActionType = "pergunta" | "sugestao" | "busca_conhecimento";

export interface AiUsageEntry {
  id: string;
  actionType: AiUsageActionType;
  module: AiContextType;
  createdBy: string | null;
  createdAt: string;
}

export interface AiDashboardSummary {
  totalConversations: number;
  totalMessages: number;
  totalSuggestions: number;
  totalFavorites: number;
  totalPrompts: number;
  usageLast30Days: number;
}

export interface AiDashboardData {
  summary: AiDashboardSummary;
  recentQuestions: AiMessage[];
  suggestions: AiSuggestion[];
  history: AiConversation[];
  favorites: AiMessage[];
  prompts: AiPrompt[];
  ownerOptions: { id: string; name: string | null; email: string | null }[];
}

export interface AiChatPageData {
  conversations: AiConversation[];
  prompts: AiPrompt[];
  activeConversation: AiConversationDetail | null;
}

export interface AiAssistantData {
  suggestions: AiSuggestion[];
}
