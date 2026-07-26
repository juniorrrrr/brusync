import { deriveMetrics } from "@/domain/metaAds/metrics";
import type {
  MetaAccount,
  MetaAdsAlert,
  MetaCampaign,
  MetaInsightRaw,
  MetaSyncJob,
} from "@/types/metaAds";

const HIGH_CPA_THRESHOLD = 150;
const LOW_ROAS_THRESHOLD = 1.5;
const TOKEN_EXPIRING_SOON_DAYS = 7;

export interface ComputeAlertsInput {
  account: MetaAccount | null;
  campaigns: { campaign: MetaCampaign; last7Days: MetaInsightRaw }[];
  failedAds: { id: string; name: string; campaignName: string }[];
  recentFailedJobs: MetaSyncJob[];
  tokenExpiresAt: string | null;
}

/** Nenhum componente React decide o que é alerta — tudo calculado aqui a
 * partir de dados já sincronizados (nenhuma chamada à Graph API nesta
 * função). components/metaAds/MetaAdsAlertsList.tsx só renderiza a lista. */
export function computeMetaAdsAlerts(input: ComputeAlertsInput): MetaAdsAlert[] {
  const alerts: MetaAdsAlert[] = [];

  if (input.account?.status !== "conectado") {
    alerts.push({
      kind: "conta_desconectada",
      severity: "critico",
      title: "Conta do Meta Ads desconectada",
      description: input.account?.error ?? "Reconecte a conta em Meta Ads → Configurações.",
      entityId: input.account?.id ?? null,
      entityName: input.account?.name ?? null,
      href: "/meta-ads/configuracoes",
    });
  }

  if (input.tokenExpiresAt) {
    const daysLeft = Math.floor(
      (new Date(input.tokenExpiresAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000),
    );
    if (daysLeft <= TOKEN_EXPIRING_SOON_DAYS) {
      alerts.push({
        kind: "token_expirando",
        severity: daysLeft <= 1 ? "critico" : "atencao",
        title: daysLeft <= 0 ? "Token do Meta Ads expirado" : "Token do Meta Ads expirando",
        description:
          daysLeft <= 0
            ? "O Access Token expirou — reconecte a conta para retomar a sincronização."
            : `O Access Token expira em ${daysLeft} dia(s) — reconecte para renovar automaticamente.`,
        entityId: null,
        entityName: null,
        href: "/meta-ads/configuracoes",
      });
    }
  }

  for (const { campaign, last7Days } of input.campaigns) {
    if (campaign.status === "PAUSED") {
      alerts.push({
        kind: "campanha_pausada",
        severity: "info",
        title: "Campanha pausada",
        description: campaign.name,
        entityId: campaign.id,
        entityName: campaign.name,
        href: `/meta-ads/campanhas?campaignId=${campaign.id}`,
      });
      continue;
    }

    if (campaign.status === "ACTIVE" && last7Days.spend === 0) {
      alerts.push({
        kind: "campanha_sem_gasto",
        severity: "atencao",
        title: "Campanha ativa sem gasto nos últimos 7 dias",
        description: campaign.name,
        entityId: campaign.id,
        entityName: campaign.name,
        href: `/meta-ads/campanhas?campaignId=${campaign.id}`,
      });
      continue;
    }

    const metrics = deriveMetrics(last7Days);
    if (metrics.cpa !== null && metrics.cpa > HIGH_CPA_THRESHOLD) {
      alerts.push({
        kind: "cpa_elevado",
        severity: "atencao",
        title: "CPA elevado nos últimos 7 dias",
        description: `${campaign.name} — CPA de R$ ${metrics.cpa.toFixed(2)}`,
        entityId: campaign.id,
        entityName: campaign.name,
        href: `/meta-ads/campanhas?campaignId=${campaign.id}`,
      });
    }
    if (metrics.roas !== null && metrics.roas < LOW_ROAS_THRESHOLD && last7Days.spend > 0) {
      alerts.push({
        kind: "roas_baixo",
        severity: "critico",
        title: "ROAS baixo nos últimos 7 dias",
        description: `${campaign.name} — ROAS de ${metrics.roas.toFixed(2)}x`,
        entityId: campaign.id,
        entityName: campaign.name,
        href: `/meta-ads/campanhas?campaignId=${campaign.id}`,
      });
    }
  }

  for (const ad of input.failedAds) {
    alerts.push({
      kind: "anuncio_reprovado",
      severity: "critico",
      title: "Anúncio reprovado",
      description: `${ad.name} — ${ad.campaignName}`,
      entityId: ad.id,
      entityName: ad.name,
      href: "/meta-ads/criativos",
    });
  }

  for (const job of input.recentFailedJobs) {
    alerts.push({
      kind: "falha_sincronizacao",
      severity: "atencao",
      title: "Falha na sincronização do Meta Ads",
      description: job.error ?? `Job "${job.jobType}" falhou após ${job.attempts} tentativa(s).`,
      entityId: job.id,
      entityName: job.jobType,
      href: "/meta-ads/configuracoes",
    });
  }

  const severityOrder: Record<MetaAdsAlert["severity"], number> = {
    critico: 0,
    atencao: 1,
    info: 2,
  };
  return alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
}
