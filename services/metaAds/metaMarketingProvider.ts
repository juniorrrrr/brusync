import "server-only";

import type {
  ExchangeCodeInput,
  ExchangeCodeResult,
  FetchInsightsInput,
  MetaAdsOAuthCredentials,
  MetaAdsProvider,
  RemoteAd,
  RemoteAdAccount,
  RemoteAdSet,
  RemoteAudience,
  RemoteBusiness,
  RemoteCampaign,
  RemoteConversionEventRow,
  RemoteCreative,
  RemoteInsightRow,
  RemoteMetaUser,
  ValidateTokenResult,
} from "@/domain/metaAds/provider";

const GRAPH_API_BASE = "https://graph.facebook.com/v19.0";
const AUTH_DIALOG_BASE = "https://www.facebook.com/v19.0/dialog/oauth";

const OAUTH_SCOPES = ["ads_management", "ads_read", "business_management", "read_insights"];

function getAppCredentials(): { appId: string; appSecret: string } {
  const appId = process.env.META_ADS_APP_ID;
  const appSecret = process.env.META_ADS_APP_SECRET;
  if (!appId || !appSecret) {
    throw new Error(
      "META_ADS_APP_ID/META_ADS_APP_SECRET não configurados — cadastre um app da Meta com a Marketing API habilitada antes de conectar o Meta Ads.",
    );
  }
  return { appId, appSecret };
}

async function graphRequest<T = Record<string, unknown>>(
  path: string,
  accessToken: string,
  init?: RequestInit,
): Promise<T> {
  const url = path.startsWith("http") ? path : `${GRAPH_API_BASE}/${path}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init?.headers ?? {}),
    },
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = data?.error?.message ?? `Erro ${response.status} na Marketing API.`;
    throw new Error(message);
  }
  return data as T;
}

/** Segue o cursor `paging.next` até esgotar, respeitando o rate limit da
 * Meta com um pequeno intervalo entre páginas (boas práticas exigidas pela
 * Fase 29 — nunca chamadas desnecessárias, paginação completa). */
async function graphPaginate<T = Record<string, unknown>>(
  path: string,
  accessToken: string,
): Promise<T[]> {
  const results: T[] = [];
  let nextUrl: string | null = `${GRAPH_API_BASE}/${path}`;

  while (nextUrl) {
    const page: { data: T[]; paging?: { next?: string } } = await graphRequest(
      nextUrl,
      accessToken,
    );
    results.push(...(page.data ?? []));
    nextUrl = page.paging?.next ?? null;
    if (nextUrl) await new Promise((resolve) => setTimeout(resolve, 150));
  }

  return results;
}

function toNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function sumActions(
  actions: { action_type: string; value: string }[] | undefined,
  types: string[],
): number {
  if (!actions) return 0;
  return actions
    .filter((a) => types.includes(a.action_type))
    .reduce((sum, a) => sum + toNumber(a.value), 0);
}

const LEAD_ACTION_TYPES = ["lead", "onsite_conversion.lead_grouped"];
const PURCHASE_ACTION_TYPES = ["purchase", "omni_purchase"];

/** Mapeia o `action_type` bruto da Meta para os nomes de evento padrão do
 * Brusync (META_CONVERSION_EVENT_NAMES, types/metaAds.ts) — os mesmos nomes
 * usados pelo Meta Conversions API (domain/metaConversionsApi/eventNames.ts,
 * Fase 9), para nunca ter dois vocabulários de evento coexistindo. */
const EVENT_TYPE_LABEL_MAP: Record<
  string,
  "Purchase" | "Lead" | "CompleteRegistration" | "AddToCart" | "ViewContent" | "PageView"
> = {
  purchase: "Purchase",
  omni_purchase: "Purchase",
  lead: "Lead",
  "onsite_conversion.lead_grouped": "Lead",
  complete_registration: "CompleteRegistration",
  "onsite_conversion.complete_registration": "CompleteRegistration",
  add_to_cart: "AddToCart",
  "onsite_conversion.add_to_cart": "AddToCart",
  view_content: "ViewContent",
  "onsite_conversion.view_content": "ViewContent",
  landing_page_view: "PageView",
};

/** Única implementação real desta fase — chama a Graph Marketing API
 * diretamente. Nenhuma outra camada da aplicação importa este arquivo;
 * tudo passa por services/metaAds/metaAdsProviderFactory.ts (Provider
 * Pattern, mesmo padrão de services/whatsapp/metaCloudProvider.ts). */
export class MetaMarketingProvider implements MetaAdsProvider {
  readonly name = "meta_marketing_api";

  buildAuthorizeUrl(redirectUri: string, state: string): string {
    const { appId } = getAppCredentials();
    const params = new URLSearchParams({
      client_id: appId,
      redirect_uri: redirectUri,
      state,
      scope: OAUTH_SCOPES.join(","),
      response_type: "code",
    });
    return `${AUTH_DIALOG_BASE}?${params.toString()}`;
  }

  async exchangeCodeForToken(input: ExchangeCodeInput): Promise<ExchangeCodeResult> {
    const { appId, appSecret } = getAppCredentials();
    const params = new URLSearchParams({
      client_id: appId,
      client_secret: appSecret,
      redirect_uri: input.redirectUri,
      code: input.code,
    });
    const data = await graphRequest<{ access_token: string; expires_in?: number }>(
      `oauth/access_token?${params.toString()}`,
      "",
    );
    return {
      accessToken: data.access_token,
      tokenType: "short_lived",
      expiresInSeconds: data.expires_in ?? null,
    };
  }

  async exchangeForLongLivedToken(shortLivedToken: string): Promise<ExchangeCodeResult> {
    const { appId, appSecret } = getAppCredentials();
    const params = new URLSearchParams({
      grant_type: "fb_exchange_token",
      client_id: appId,
      client_secret: appSecret,
      fb_exchange_token: shortLivedToken,
    });
    const data = await graphRequest<{ access_token: string; expires_in?: number }>(
      `oauth/access_token?${params.toString()}`,
      "",
    );
    return {
      accessToken: data.access_token,
      tokenType: "long_lived",
      expiresInSeconds: data.expires_in ?? null,
    };
  }

  async validateToken(credentials: MetaAdsOAuthCredentials): Promise<ValidateTokenResult> {
    try {
      const data = await graphRequest<{ id: string; name?: string; email?: string }>(
        "me?fields=id,name,email",
        credentials.accessToken,
      );
      return { ok: true, metaUserId: data.id, name: data.name, email: data.email };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Falha ao validar token.",
      };
    }
  }

  async getMe(credentials: MetaAdsOAuthCredentials): Promise<RemoteMetaUser> {
    const data = await graphRequest<{ id: string; name?: string; email?: string }>(
      "me?fields=id,name,email",
      credentials.accessToken,
    );
    return { metaUserId: data.id, name: data.name ?? null, email: data.email ?? null };
  }

  async listBusinesses(credentials: MetaAdsOAuthCredentials): Promise<RemoteBusiness[]> {
    const rows = await graphPaginate<{
      id: string;
      name: string;
      verification_status?: string;
    }>("me/businesses?fields=id,name,verification_status&limit=100", credentials.accessToken);

    return rows.map((r) => ({
      metaBusinessId: r.id,
      name: r.name,
      verificationStatus: r.verification_status ?? null,
    }));
  }

  async listAdAccounts(
    credentials: MetaAdsOAuthCredentials,
    businessId: string | null,
  ): Promise<RemoteAdAccount[]> {
    const path = businessId
      ? `${businessId}/owned_ad_accounts?fields=account_id,name,currency,timezone_name,account_status&limit=100`
      : "me/adaccounts?fields=account_id,name,currency,timezone_name,account_status&limit=100";

    const rows = await graphPaginate<{
      account_id: string;
      name: string;
      currency: string;
      timezone_name?: string;
      account_status?: number;
    }>(path, credentials.accessToken);

    return rows.map((r) => ({
      metaAdAccountId: `act_${r.account_id}`,
      name: r.name,
      currency: r.currency,
      timezoneName: r.timezone_name ?? null,
      accountStatus: r.account_status !== undefined ? String(r.account_status) : null,
      businessId,
    }));
  }

  async listCampaigns(
    credentials: MetaAdsOAuthCredentials,
    adAccountMetaId: string,
  ): Promise<RemoteCampaign[]> {
    const rows = await graphPaginate<{
      id: string;
      name: string;
      objective?: string;
      status: string;
      effective_status?: string;
      daily_budget?: string;
      lifetime_budget?: string;
      budget_remaining?: string;
      start_time?: string;
      stop_time?: string;
    }>(
      `${adAccountMetaId}/campaigns?fields=id,name,objective,status,effective_status,daily_budget,lifetime_budget,budget_remaining,start_time,stop_time&limit=100`,
      credentials.accessToken,
    );

    return rows.map((r) => ({
      metaCampaignId: r.id,
      name: r.name,
      objective: r.objective ?? null,
      status: r.status,
      effectiveStatus: r.effective_status ?? null,
      dailyBudget: r.daily_budget ? toNumber(r.daily_budget) / 100 : null,
      lifetimeBudget: r.lifetime_budget ? toNumber(r.lifetime_budget) / 100 : null,
      budgetRemaining: r.budget_remaining ? toNumber(r.budget_remaining) / 100 : null,
      startTime: r.start_time ?? null,
      stopTime: r.stop_time ?? null,
    }));
  }

  async listAdSets(
    credentials: MetaAdsOAuthCredentials,
    campaignMetaId: string,
  ): Promise<RemoteAdSet[]> {
    const rows = await graphPaginate<{
      id: string;
      campaign_id: string;
      name: string;
      status: string;
      effective_status?: string;
      daily_budget?: string;
      lifetime_budget?: string;
      optimization_goal?: string;
      billing_event?: string;
      targeting?: Record<string, unknown>;
      start_time?: string;
      end_time?: string;
    }>(
      `${campaignMetaId}/adsets?fields=id,campaign_id,name,status,effective_status,daily_budget,lifetime_budget,optimization_goal,billing_event,targeting,start_time,end_time&limit=100`,
      credentials.accessToken,
    );

    return rows.map((r) => ({
      metaAdSetId: r.id,
      metaCampaignId: r.campaign_id,
      name: r.name,
      status: r.status,
      effectiveStatus: r.effective_status ?? null,
      dailyBudget: r.daily_budget ? toNumber(r.daily_budget) / 100 : null,
      lifetimeBudget: r.lifetime_budget ? toNumber(r.lifetime_budget) / 100 : null,
      optimizationGoal: r.optimization_goal ?? null,
      billingEvent: r.billing_event ?? null,
      targeting: r.targeting ?? {},
      startTime: r.start_time ?? null,
      endTime: r.end_time ?? null,
    }));
  }

  async listAds(credentials: MetaAdsOAuthCredentials, adSetMetaId: string): Promise<RemoteAd[]> {
    const rows = await graphPaginate<{
      id: string;
      adset_id: string;
      name: string;
      status: string;
      effective_status?: string;
      creative?: { id: string };
    }>(
      `${adSetMetaId}/ads?fields=id,adset_id,name,status,effective_status,creative{id}&limit=100`,
      credentials.accessToken,
    );

    return rows.map((r) => ({
      metaAdId: r.id,
      metaAdSetId: r.adset_id,
      metaCreativeId: r.creative?.id ?? null,
      name: r.name,
      status: r.status,
      effectiveStatus: r.effective_status ?? null,
    }));
  }

  async listCreatives(
    credentials: MetaAdsOAuthCredentials,
    adAccountMetaId: string,
  ): Promise<RemoteCreative[]> {
    const rows = await graphPaginate<{
      id: string;
      name?: string;
      status?: string;
      thumbnail_url?: string;
      image_url?: string;
      video_id?: string;
      object_story_spec?: {
        link_data?: {
          message?: string;
          name?: string;
          description?: string;
          call_to_action?: { type?: string };
        };
        video_data?: { message?: string; title?: string; call_to_action?: { type?: string } };
      };
    }>(
      `${adAccountMetaId}/adcreatives?fields=id,name,status,thumbnail_url,image_url,video_id,object_story_spec&limit=100`,
      credentials.accessToken,
    );

    return rows.map((r) => {
      const linkData = r.object_story_spec?.link_data;
      const videoData = r.object_story_spec?.video_data;
      const kind: RemoteCreative["kind"] = r.video_id ? "video" : linkData ? "imagem" : "texto";

      return {
        metaCreativeId: r.id,
        name: r.name ?? null,
        kind,
        thumbnailUrl: r.thumbnail_url ?? null,
        imageUrl: r.image_url ?? null,
        videoUrl: null,
        headline: linkData?.name ?? videoData?.title ?? null,
        body: linkData?.message ?? videoData?.message ?? null,
        description: linkData?.description ?? null,
        callToAction: linkData?.call_to_action?.type ?? videoData?.call_to_action?.type ?? null,
        status: r.status ?? null,
      };
    });
  }

  async listAudiences(
    credentials: MetaAdsOAuthCredentials,
    adAccountMetaId: string,
  ): Promise<RemoteAudience[]> {
    const rows = await graphPaginate<{
      id: string;
      name: string;
      subtype?: string;
      approximate_count_lower_bound?: number;
      operation_status?: { code?: string };
      description?: string;
    }>(
      `${adAccountMetaId}/customaudiences?fields=id,name,subtype,approximate_count_lower_bound,operation_status,description&limit=100`,
      credentials.accessToken,
    );

    return rows.map((r) => ({
      metaAudienceId: r.id,
      name: r.name,
      kind: r.subtype === "LOOKALIKE" ? "lookalike" : r.subtype === "SAVED" ? "saved" : "custom",
      approximateCount: r.approximate_count_lower_bound ?? null,
      status: r.operation_status?.code ?? null,
      origin: r.description ?? null,
    }));
  }

  async fetchInsights(
    credentials: MetaAdsOAuthCredentials,
    adAccountMetaId: string,
    input: FetchInsightsInput,
  ): Promise<RemoteInsightRow[]> {
    const idFields =
      input.level === "account"
        ? []
        : input.level === "campaign"
          ? ["campaign_id"]
          : input.level === "ad_set"
            ? ["campaign_id", "adset_id"]
            : ["campaign_id", "adset_id", "ad_id"];

    const fields = [
      "date_start",
      ...idFields,
      "impressions",
      "reach",
      "frequency",
      "clicks",
      "spend",
      "actions",
      "action_values",
    ].join(",");
    const params = new URLSearchParams({
      fields,
      time_increment: "1",
      time_range: JSON.stringify({ since: input.since, until: input.until }),
      level: input.level,
      limit: "500",
    });

    const rows = await graphPaginate<{
      date_start: string;
      campaign_id?: string;
      adset_id?: string;
      ad_id?: string;
      impressions?: string;
      reach?: string;
      frequency?: string;
      clicks?: string;
      spend?: string;
      actions?: { action_type: string; value: string }[];
      action_values?: { action_type: string; value: string }[];
    }>(`${adAccountMetaId}/insights?${params.toString()}`, credentials.accessToken);

    return rows.map((r) => ({
      level: input.level,
      campaignMetaId: r.campaign_id ?? null,
      adSetMetaId: r.adset_id ?? null,
      adMetaId: r.ad_id ?? null,
      date: r.date_start,
      impressions: toNumber(r.impressions),
      reach: toNumber(r.reach),
      frequency: r.frequency ? toNumber(r.frequency) : null,
      clicks: toNumber(r.clicks),
      spend: toNumber(r.spend),
      conversions: sumActions(r.actions, [...LEAD_ACTION_TYPES, ...PURCHASE_ACTION_TYPES]),
      leads: sumActions(r.actions, LEAD_ACTION_TYPES),
      purchases: sumActions(r.actions, PURCHASE_ACTION_TYPES),
      revenue: sumActions(r.action_values, PURCHASE_ACTION_TYPES),
    }));
  }

  async fetchConversionEvents(
    credentials: MetaAdsOAuthCredentials,
    adAccountMetaId: string,
    since: string,
    until: string,
  ): Promise<RemoteConversionEventRow[]> {
    const params = new URLSearchParams({
      fields: "date_start,campaign_id,actions,action_values",
      time_increment: "1",
      time_range: JSON.stringify({ since, until }),
      level: "campaign",
      limit: "500",
    });

    const rows = await graphPaginate<{
      date_start: string;
      campaign_id?: string;
      actions?: { action_type: string; value: string }[];
      action_values?: { action_type: string; value: string }[];
    }>(`${adAccountMetaId}/insights?${params.toString()}`, credentials.accessToken);

    const results: RemoteConversionEventRow[] = [];
    for (const row of rows) {
      for (const [rawType, label] of Object.entries(EVENT_TYPE_LABEL_MAP)) {
        const count = sumActions(row.actions, [rawType]);
        if (count === 0) continue;
        results.push({
          campaignMetaId: row.campaign_id ?? null,
          adMetaId: null,
          date: row.date_start,
          eventName: label,
          eventCount: count,
          value: sumActions(row.action_values, [rawType]),
          currency: "BRL",
        });
      }
    }
    return results;
  }
}
