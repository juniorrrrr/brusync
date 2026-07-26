import type {
  MetaAccountStatus,
  MetaAdsAlertKind,
  MetaAudienceKind,
  MetaCampaignStatus,
  MetaCreativeKind,
  MetaSyncJobStatus,
} from "@/types/metaAds";

export const ACCOUNT_STATUS_LABEL: Record<MetaAccountStatus, string> = {
  conectado: "Conectado",
  desconectado: "Desconectado",
  erro: "Erro",
};

export const ACCOUNT_STATUS_BADGE: Record<MetaAccountStatus, string> = {
  conectado: "ok",
  desconectado: "neutral",
  erro: "danger",
};

export const CAMPAIGN_STATUS_LABEL: Record<MetaCampaignStatus, string> = {
  ACTIVE: "Ativa",
  PAUSED: "Pausada",
  ARCHIVED: "Arquivada",
  DELETED: "Excluída",
};

export const CAMPAIGN_STATUS_BADGE: Record<MetaCampaignStatus, string> = {
  ACTIVE: "ok",
  PAUSED: "neutral",
  ARCHIVED: "neutral",
  DELETED: "danger",
};

export const CREATIVE_KIND_LABEL: Record<MetaCreativeKind, string> = {
  imagem: "Imagem",
  video: "Vídeo",
  carrossel: "Carrossel",
  texto: "Texto",
};

export const AUDIENCE_KIND_LABEL: Record<MetaAudienceKind, string> = {
  custom: "Custom Audience",
  lookalike: "Lookalike",
  saved: "Saved Audience",
};

export const SYNC_JOB_STATUS_LABEL: Record<MetaSyncJobStatus, string> = {
  pendente: "Pendente",
  executando: "Executando",
  concluido: "Concluído",
  falhou: "Falhou",
};

export const SYNC_JOB_STATUS_BADGE: Record<MetaSyncJobStatus, string> = {
  pendente: "neutral",
  executando: "info",
  concluido: "ok",
  falhou: "danger",
};

/** Mesma paleta info/warn/danger de domain/intelligence/types.ts::
 * intelligenceSeverityBadge — nenhum vocabulário de badge novo é criado. */
export function alertSeverityBadge(severity: "info" | "atencao" | "critico"): string {
  switch (severity) {
    case "critico":
      return "danger";
    case "atencao":
      return "warn";
    default:
      return "info";
  }
}

export const ALERT_SEVERITY_LABEL: Record<"info" | "atencao" | "critico", string> = {
  info: "Informativo",
  atencao: "Atenção",
  critico: "Crítico",
};

export const ALERT_KIND_LABEL: Record<MetaAdsAlertKind, string> = {
  campanha_pausada: "Campanha pausada",
  campanha_sem_gasto: "Campanha sem gasto",
  cpa_elevado: "CPA elevado",
  roas_baixo: "ROAS baixo",
  anuncio_reprovado: "Anúncio reprovado",
  conta_desconectada: "Conta desconectada",
  token_expirando: "Token expirando",
  falha_sincronizacao: "Falha de sincronização",
};
