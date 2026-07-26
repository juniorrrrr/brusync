import type {
  WhatsappAccountStatus,
  WhatsappAutomationTrigger,
  WhatsappConversationStatus,
  WhatsappMessageStatus,
  WhatsappMessageType,
  WhatsappTemplateCategory,
  WhatsappTemplateStatus,
} from "@/types/whatsapp";

export const ACCOUNT_STATUS_LABEL: Record<WhatsappAccountStatus, string> = {
  conectado: "Conectado",
  desconectado: "Desconectado",
  erro: "Erro",
};

export const ACCOUNT_STATUS_BADGE: Record<WhatsappAccountStatus, string> = {
  conectado: "ok",
  desconectado: "neutral",
  erro: "danger",
};

export const CONVERSATION_STATUS_LABEL: Record<WhatsappConversationStatus, string> = {
  aberta: "Aberta",
  pendente: "Pendente",
  encerrada: "Encerrada",
};

export const CONVERSATION_STATUS_BADGE: Record<WhatsappConversationStatus, string> = {
  aberta: "info",
  pendente: "warn",
  encerrada: "neutral",
};

export const MESSAGE_STATUS_LABEL: Record<WhatsappMessageStatus, string> = {
  pendente: "Enviando…",
  enviado: "Enviado",
  entregue: "Entregue",
  lido: "Lido",
  falhou: "Falhou",
};

export const MESSAGE_TYPE_LABEL: Record<WhatsappMessageType, string> = {
  texto: "Texto",
  imagem: "Imagem",
  video: "Vídeo",
  documento: "Documento",
  audio: "Áudio",
  localizacao: "Localização",
  contato: "Contato",
  template: "Template",
};

export const TEMPLATE_CATEGORY_LABEL: Record<WhatsappTemplateCategory, string> = {
  marketing: "Marketing",
  utility: "Utilidade",
  authentication: "Autenticação",
};

export const TEMPLATE_STATUS_LABEL: Record<WhatsappTemplateStatus, string> = {
  pendente: "Pendente",
  aprovado: "Aprovado",
  rejeitado: "Rejeitado",
};

export const TEMPLATE_STATUS_BADGE: Record<WhatsappTemplateStatus, string> = {
  pendente: "warn",
  aprovado: "ok",
  rejeitado: "danger",
};

export const AUTOMATION_TRIGGER_LABEL: Record<WhatsappAutomationTrigger, string> = {
  novo_lead: "Novo lead",
  mudanca_pipeline: "Mudança de pipeline",
  venda_concluida: "Venda concluída",
  pagamento_recebido: "Pagamento recebido",
  projeto_iniciado: "Projeto iniciado",
  projeto_finalizado: "Projeto finalizado",
  agendamento_confirmado: "Agendamento confirmado",
  aniversario: "Aniversário",
  lembrete: "Lembrete",
};

export const AUTOMATION_TRIGGERS: WhatsappAutomationTrigger[] = [
  "novo_lead",
  "mudanca_pipeline",
  "venda_concluida",
  "pagamento_recebido",
  "projeto_iniciado",
  "projeto_finalizado",
  "agendamento_confirmado",
  "aniversario",
  "lembrete",
];

/** Gatilhos que hoje têm um ponto de disparo real (Event Bus já publica o
 * evento correspondente — ver domain/automation/eventMap.ts) — os demais
 * (projeto iniciado/finalizado) ficam com a automação pronta para
 * configurar, mas sem disparo automático ainda, para não exigir alterar
 * services/projects/* nesta fase (ver relatório técnico). */
export const AUTOMATION_TRIGGERS_LIVE: WhatsappAutomationTrigger[] = [
  "novo_lead",
  "venda_concluida",
  "pagamento_recebido",
  "agendamento_confirmado",
  "aniversario",
  "lembrete",
];
