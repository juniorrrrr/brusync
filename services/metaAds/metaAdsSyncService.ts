import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { computeHealthScore } from "@/domain/integrations/health";
import { MAX_SYNC_ATTEMPTS, nextAttemptAt } from "@/domain/integrations/syncBackoff";
import type { MetaAdsOAuthCredentials } from "@/domain/metaAds/provider";
import { createIntegrationLog } from "@/repositories/integrations/integrationLogsRepository";
import {
  getIntegrationByProvider,
  updateIntegration,
} from "@/repositories/integrations/integrationsRepository";
import {
  getMetaAccountById,
  setMetaAccountStatus,
} from "@/repositories/metaAds/accountsRepository";
import {
  listAdAccounts,
  type UpsertAdAccountRow,
  upsertAdAccounts,
} from "@/repositories/metaAds/adAccountsRepository";
import { listAdSetsByCampaign, upsertAdSets } from "@/repositories/metaAds/adSetsRepository";
import { listAdsByAdSet, upsertAds } from "@/repositories/metaAds/adsRepository";
import { upsertAudiences } from "@/repositories/metaAds/audiencesRepository";
import { listBusinesses, upsertBusinesses } from "@/repositories/metaAds/businessesRepository";
import { listCampaigns, upsertCampaigns } from "@/repositories/metaAds/campaignsRepository";
import { upsertConversionEvents } from "@/repositories/metaAds/conversionEventsRepository";
import { listCreatives, upsertCreatives } from "@/repositories/metaAds/creativesRepository";
import { upsertInsights } from "@/repositories/metaAds/insightsRepository";
import {
  enqueueSyncJob,
  listDueSyncJobs,
  listRecentJobs,
  markJobFailed,
  markJobRunning,
  markJobSucceeded,
} from "@/repositories/metaAds/syncJobsRepository";
import { getDecryptedAccessToken } from "@/services/metaAds/metaAdsAccountService";
import { getMetaAdsProvider } from "@/services/metaAds/metaAdsProviderFactory";
import type { MetaSyncJob } from "@/types/metaAds";

const INITIAL_SYNC_DAYS = 30;
const INCREMENTAL_SYNC_DAYS = 3;
const META_ADS_MANAGER_PROVIDER = "meta_ads_manager";

/** Espelha o resultado de um job (sucesso ou falha) na linha genérica de
 * public.integrations + integration_logs — o mesmo par de tabelas que todo
 * outro provider (Fase 34) usa, para que o card/Drawer da Central de
 * Integrações e o monitoramento da Central de Operações reflitam o estado
 * real do Meta Ads sem conhecer nada específico da Graph API. Nunca lança:
 * uma falha aqui não pode derrubar o processamento do job em si. */
async function reflectJobOutcomeOnIntegration(
  supabase: SupabaseClient,
  accountId: string,
  outcome: "success" | "error",
  message: string,
  durationMs: number | null,
  /** Só vira "erro" no card quando a fila já esgotou as tentativas — uma
   * falha isolada que ainda vai reprocessar sozinha em minutos (backoff)
   * não deveria fazer o badge piscar "Erro" para o usuário. */
  exhaustedRetries: boolean,
): Promise<void> {
  try {
    const integration = await getIntegrationByProvider(supabase, META_ADS_MANAGER_PROVIDER);
    if (!integration) return;

    const recentJobs = await listRecentJobs(supabase, accountId, 10);
    const healthScore = computeHealthScore(
      recentJobs
        .filter((j) => j.status === "concluido" || j.status === "falhou")
        .map((j) => (j.status === "concluido" ? "success" : "error")),
    );

    const shouldMarkErrored = outcome === "error" && exhaustedRetries;
    await updateIntegration(supabase, META_ADS_MANAGER_PROVIDER, {
      status: outcome === "success" ? "conectado" : shouldMarkErrored ? "erro" : integration.status,
      lastSync: outcome === "success" ? new Date().toISOString() : integration.lastSync,
      healthScore,
      error: shouldMarkErrored ? message : outcome === "success" ? null : integration.error,
    });

    await createIntegrationLog(supabase, {
      integrationId: integration.id,
      event: outcome === "success" ? "sincronizacao_concluida" : "sincronizacao_falhou",
      status: outcome,
      message,
      origin: "meta_ads_manager",
      destination: "crm",
      durationMs,
    });
  } catch {
    // Best-effort — nunca deve derrubar o job real por causa do espelho.
  }
}

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

async function syncAdAccountEntities(
  supabase: SupabaseClient,
  credentials: MetaAdsOAuthCredentials,
  adAccountInternalId: string,
  adAccountMetaId: string,
): Promise<Record<string, number>> {
  const provider = getMetaAdsProvider();
  const stats: Record<string, number> = {};

  const remoteCampaigns = await provider.listCampaigns(credentials, adAccountMetaId);
  await upsertCampaigns(supabase, adAccountInternalId, remoteCampaigns);
  stats.campaigns = remoteCampaigns.length;

  const campaigns = await listCampaigns(supabase, { adAccountId: adAccountInternalId });

  let adSetCount = 0;
  let adCount = 0;
  for (const campaign of campaigns) {
    const remoteAdSets = await provider.listAdSets(credentials, campaign.metaCampaignId);
    await upsertAdSets(supabase, campaign.id, remoteAdSets);
    adSetCount += remoteAdSets.length;

    const adSets = await listAdSetsByCampaign(supabase, campaign.id);
    for (const adSet of adSets) {
      const remoteAds = await provider.listAds(credentials, adSet.metaAdSetId);
      adCount += remoteAds.length;
      // creatives já foram sincronizados abaixo para a conta inteira antes
      // desta chamada (ver ordem em runFullAdAccountSync) — resolvido por
      // meta_creative_id -> id na própria tabela via upsertAds abaixo.
      const creatives = await listCreatives(supabase, adAccountInternalId);
      const creativeByMetaId = new Map(creatives.map((c) => [c.metaCreativeId, c.id]));
      await upsertAds(
        supabase,
        adSet.id,
        remoteAds.map((ad) => ({
          metaAdId: ad.metaAdId,
          creativeId: ad.metaCreativeId ? (creativeByMetaId.get(ad.metaCreativeId) ?? null) : null,
          name: ad.name,
          status: ad.status,
          effectiveStatus: ad.effectiveStatus,
        })),
      );
    }
  }
  stats.adSets = adSetCount;
  stats.ads = adCount;

  return stats;
}

async function syncInsightsForAdAccount(
  supabase: SupabaseClient,
  credentials: MetaAdsOAuthCredentials,
  adAccountInternalId: string,
  adAccountMetaId: string,
  since: string,
): Promise<number> {
  const provider = getMetaAdsProvider();
  const until = todayIso();
  let totalRows = 0;

  for (const level of ["account", "campaign", "ad_set", "ad"] as const) {
    const remoteRows = await provider.fetchInsights(credentials, adAccountMetaId, {
      level,
      since,
      until,
    });
    if (remoteRows.length === 0) continue;

    const campaignIds = new Map<string, string>();
    const adSetIds = new Map<string, string>();
    const adIds = new Map<string, string>();

    if (level !== "account") {
      const campaigns = await listCampaigns(supabase, { adAccountId: adAccountInternalId });
      for (const c of campaigns) campaignIds.set(c.metaCampaignId, c.id);
    }
    if (level === "ad_set" || level === "ad") {
      const campaigns = await listCampaigns(supabase, { adAccountId: adAccountInternalId });
      for (const c of campaigns) {
        const adSets = await listAdSetsByCampaign(supabase, c.id);
        for (const s of adSets) adSetIds.set(s.metaAdSetId, s.id);
      }
    }
    if (level === "ad") {
      for (const adSetInternalId of adSetIds.values()) {
        const ads = await listAdsByAdSet(supabase, adSetInternalId);
        for (const a of ads) adIds.set(a.metaAdId, a.id);
      }
    }

    await upsertInsights(
      supabase,
      adAccountInternalId,
      remoteRows.map((row) => ({
        level: row.level,
        campaignId: row.campaignMetaId ? (campaignIds.get(row.campaignMetaId) ?? null) : null,
        adSetId: row.adSetMetaId ? (adSetIds.get(row.adSetMetaId) ?? null) : null,
        adId: row.adMetaId ? (adIds.get(row.adMetaId) ?? null) : null,
        date: row.date,
        impressions: row.impressions,
        reach: row.reach,
        frequency: row.frequency,
        clicks: row.clicks,
        spend: row.spend,
        conversions: row.conversions,
        leads: row.leads,
        purchases: row.purchases,
        revenue: row.revenue,
      })),
    );
    totalRows += remoteRows.length;
  }

  const remoteConversions = await provider.fetchConversionEvents(
    credentials,
    adAccountMetaId,
    since,
    until,
  );
  if (remoteConversions.length > 0) {
    const campaigns = await listCampaigns(supabase, { adAccountId: adAccountInternalId });
    const campaignIds = new Map(campaigns.map((c) => [c.metaCampaignId, c.id]));
    await upsertConversionEvents(
      supabase,
      adAccountInternalId,
      remoteConversions.map((row) => ({
        campaignId: row.campaignMetaId ? (campaignIds.get(row.campaignMetaId) ?? null) : null,
        adId: null,
        date: row.date,
        eventName: row.eventName,
        eventCount: row.eventCount,
        value: row.value,
        currency: row.currency,
      })),
    );
  }

  return totalRows;
}

async function runFullSync(
  supabase: SupabaseClient,
  accountId: string,
): Promise<Record<string, number>> {
  const token = await getDecryptedAccessToken(accountId);
  if (!token) throw new Error("Nenhum Access Token salvo para esta conta.");
  const credentials: MetaAdsOAuthCredentials = { accessToken: token };
  const provider = getMetaAdsProvider();

  const remoteBusinesses = await provider.listBusinesses(credentials);
  await upsertBusinesses(
    supabase,
    accountId,
    remoteBusinesses.map((b) => ({
      metaBusinessId: b.metaBusinessId,
      name: b.name,
      verificationStatus: b.verificationStatus,
    })),
  );

  const businesses = await listBusinesses(supabase, accountId);
  const stats: Record<string, number> = { businesses: businesses.length, adAccounts: 0 };

  const remoteAdAccountRows: UpsertAdAccountRow[] = [];
  const adAccountBusinessMetaId = new Map<string, string | null>();
  for (const business of businesses) {
    const remoteAdAccounts = await provider.listAdAccounts(credentials, business.metaBusinessId);
    for (const acc of remoteAdAccounts) {
      remoteAdAccountRows.push({
        metaAdAccountId: acc.metaAdAccountId,
        businessId: null,
        name: acc.name,
        currency: acc.currency,
        timezoneName: acc.timezoneName,
        accountStatus: acc.accountStatus,
      });
      adAccountBusinessMetaId.set(acc.metaAdAccountId, business.metaBusinessId);
    }
  }
  if (remoteAdAccountRows.length === 0) {
    const remoteAdAccounts = await provider.listAdAccounts(credentials, null);
    for (const acc of remoteAdAccounts) {
      remoteAdAccountRows.push({
        metaAdAccountId: acc.metaAdAccountId,
        businessId: null,
        name: acc.name,
        currency: acc.currency,
        timezoneName: acc.timezoneName,
        accountStatus: acc.accountStatus,
      });
    }
  }
  await upsertAdAccounts(supabase, accountId, remoteAdAccountRows);
  stats.adAccounts = remoteAdAccountRows.length;

  const adAccounts = await listAdAccounts(supabase, accountId);
  const businessByMetaId = new Map(businesses.map((b) => [b.metaBusinessId, b.id]));

  let campaignsTotal = 0;
  let adSetsTotal = 0;
  let adsTotal = 0;
  let creativesTotal = 0;
  let audiencesTotal = 0;

  for (const adAccount of adAccounts) {
    const businessMetaId = adAccountBusinessMetaId.get(adAccount.metaAdAccountId);
    const businessInternalId = businessMetaId
      ? (businessByMetaId.get(businessMetaId) ?? null)
      : null;
    if (businessInternalId) {
      await upsertAdAccounts(supabase, accountId, [
        {
          metaAdAccountId: adAccount.metaAdAccountId,
          businessId: businessInternalId,
          name: adAccount.name,
          currency: adAccount.currency,
          timezoneName: adAccount.timezoneName,
          accountStatus: adAccount.accountStatus,
        },
      ]);
    }

    const remoteCreatives = await provider.listCreatives(credentials, adAccount.metaAdAccountId);
    await upsertCreatives(supabase, adAccount.id, remoteCreatives);
    creativesTotal += remoteCreatives.length;

    const entityStats = await syncAdAccountEntities(
      supabase,
      credentials,
      adAccount.id,
      adAccount.metaAdAccountId,
    );
    campaignsTotal += entityStats.campaigns ?? 0;
    adSetsTotal += entityStats.adSets ?? 0;
    adsTotal += entityStats.ads ?? 0;

    const remoteAudiences = await provider.listAudiences(credentials, adAccount.metaAdAccountId);
    await upsertAudiences(
      supabase,
      adAccount.id,
      remoteAudiences.map((a) => ({
        metaAudienceId: a.metaAudienceId,
        name: a.name,
        kind: a.kind,
        approximateCount: a.approximateCount,
        status: a.status,
        origin: a.origin,
      })),
    );
    audiencesTotal += remoteAudiences.length;

    await syncInsightsForAdAccount(
      supabase,
      credentials,
      adAccount.id,
      adAccount.metaAdAccountId,
      isoDaysAgo(INITIAL_SYNC_DAYS),
    );
  }

  stats.campaigns = campaignsTotal;
  stats.adSets = adSetsTotal;
  stats.ads = adsTotal;
  stats.creatives = creativesTotal;
  stats.audiences = audiencesTotal;

  return stats;
}

async function runIncrementalInsightsSync(
  supabase: SupabaseClient,
  accountId: string,
): Promise<Record<string, number>> {
  const token = await getDecryptedAccessToken(accountId);
  if (!token) throw new Error("Nenhum Access Token salvo para esta conta.");
  const credentials: MetaAdsOAuthCredentials = { accessToken: token };

  const adAccounts = await listAdAccounts(supabase, accountId);
  let totalRows = 0;
  for (const adAccount of adAccounts) {
    totalRows += await syncInsightsForAdAccount(
      supabase,
      credentials,
      adAccount.id,
      adAccount.metaAdAccountId,
      isoDaysAgo(INCREMENTAL_SYNC_DAYS),
    );
  }
  return { adAccounts: adAccounts.length, insightRows: totalRows };
}

/** Processa um job da fila — chamado tanto pela ação de "Sincronizar agora"
 * (manual) quanto pelo cron (app/api/cron/meta-ads-sync). Nunca lança para
 * fora: erros viram `falhou` + backoff exponencial (domain/integrations/
 * syncBackoff.ts), mesmo padrão do retry de conversões da Fase 8. Também
 * espelha o resultado na linha genérica de public.integrations
 * (reflectJobOutcomeOnIntegration) para o card da Central de Integrações e
 * a Central de Operações refletirem o estado real. */
export async function processSyncJob(supabase: SupabaseClient, job: MetaSyncJob): Promise<void> {
  await markJobRunning(supabase, job.id);
  const startedAt = Date.now();

  try {
    const stats =
      job.jobType === "insights"
        ? await runIncrementalInsightsSync(supabase, job.accountId)
        : await runFullSync(supabase, job.accountId);

    await markJobSucceeded(supabase, job.id, stats);
    await setMetaAccountStatus(supabase, job.accountId, "conectado");
    await reflectJobOutcomeOnIntegration(
      supabase,
      job.accountId,
      "success",
      `Sincronização (${job.jobType}) concluída.`,
      Date.now() - startedAt,
      false,
    );
  } catch (error) {
    const attempts = job.attempts + 1;
    const message = error instanceof Error ? error.message : "Falha desconhecida na sincronização.";
    await markJobFailed(supabase, job.id, attempts, nextAttemptAt(attempts), message);
    const exhaustedRetries = attempts >= MAX_SYNC_ATTEMPTS;
    if (exhaustedRetries) {
      await setMetaAccountStatus(supabase, job.accountId, "erro", { error: message });
    }
    await reflectJobOutcomeOnIntegration(
      supabase,
      job.accountId,
      "error",
      message,
      Date.now() - startedAt,
      exhaustedRetries,
    );
  }
}

/** Alvo do cron (app/api/cron/meta-ads-sync) — processa todos os jobs
 * vencidos, um de cada vez (nunca em paralelo, para respeitar o rate limit
 * da Graph API). */
export async function processDueSyncJobs(supabase: SupabaseClient): Promise<number> {
  const jobs = await listDueSyncJobs(supabase);
  for (const job of jobs) {
    await processSyncJob(supabase, job);
  }
  return jobs.length;
}

/** Enfileira a sincronização incremental diária de todas as contas
 * conectadas — chamado pelo próprio cron antes de processar a fila, para
 * que sempre haja um job "insights" pendente por conta ativa. */
export async function enqueueDailyIncrementalJobs(supabase: SupabaseClient): Promise<number> {
  const { data, error } = await supabase
    .from("meta_accounts")
    .select("id")
    .eq("status", "conectado");
  if (error) throw new Error(`Falha ao listar contas conectadas: ${error.message}`);

  let enqueued = 0;
  for (const row of (data ?? []) as { id: string }[]) {
    await enqueueSyncJob(supabase, {
      accountId: row.id,
      adAccountId: null,
      jobType: "insights",
      triggerSource: "automatico",
      createdBy: null,
    });
    enqueued += 1;
  }
  return enqueued;
}

export async function enqueueManualSync(
  supabase: SupabaseClient,
  accountId: string,
  actorProfileId: string | null,
): Promise<MetaSyncJob> {
  const account = await getMetaAccountById(supabase, accountId);
  if (!account) throw new Error("Conta do Meta Ads não encontrada.");

  return enqueueSyncJob(supabase, {
    accountId,
    adAccountId: null,
    jobType: "full",
    triggerSource: "manual",
    createdBy: actorProfileId,
  });
}
