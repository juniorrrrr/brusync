import type { AiSuggestionSeverity, AiSuggestionType } from "@/types/ai";

export const SUGGESTION_SEVERITY_BADGE: Record<AiSuggestionSeverity, string> = {
  info: "info",
  atencao: "warn",
  critico: "danger",
};

export const SUGGESTION_SEVERITY_LABEL: Record<AiSuggestionSeverity, string> = {
  info: "Informativo",
  atencao: "Atenção",
  critico: "Crítico",
};

export const SUGGESTION_TYPE_LABEL: Record<AiSuggestionType, string> = {
  resumo: "Resumo automático",
  proxima_acao: "Próxima melhor ação",
  probabilidade_fechamento: "Probabilidade de fechamento",
  risco: "Risco encontrado",
  movimentacao: "Movimentação recente",
  material_recomendado: "Material recomendado",
  projeto_relacionado: "Projeto relacionado",
  cliente_semelhante: "Cliente semelhante",
  campanha_baixo_desempenho: "Campanha com baixo desempenho",
  campanha_promissora: "Campanha promissora",
  conversao_alta: "Alta conversão",
  cac_alto: "CAC acima da média",
  roas_baixo: "ROAS abaixo do esperado",
  lead_esquecido: "Lead esquecido",
  lead_sem_contato: "Lead sem contato",
  oportunidade: "Próxima oportunidade",
  pipeline_parado: "Pipeline parado",
  resumo_comercial: "Resumo comercial",
  receita_futura: "Receita futura",
  cliente_inadimplente: "Cliente inadimplente",
  receita_em_risco: "Receita em risco",
  fluxo_caixa: "Fluxo de caixa",
  alerta_financeiro: "Alerta financeiro",
  projeto_atrasado: "Projeto atrasado",
  projeto_sem_responsavel: "Projeto sem responsável",
  tarefa_critica: "Tarefa crítica",
  carga_equipe: "Carga da equipe",
};
