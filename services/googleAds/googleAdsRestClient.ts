import "server-only";

import type {
  FetchGoogleAdsMetricsInput,
  GoogleAdsCredentials,
  GoogleAdsDataProvider,
  RemoteGoogleAdsCampaign,
  RemoteGoogleAdsCustomer,
  RemoteGoogleAdsDailyMetric,
  RemoteGoogleAdsKeyword,
  ValidateGoogleAdsTokenResult,
} from "@/domain/googleAds/provider";
import {
  buildGoogleAuthorizeUrl,
  exchangeGoogleCode,
} from "@/services/googleIntegrations/googleOAuthClient";

const API_BASE = "https://googleads.googleapis.com/v17";
const SCOPES = ["https://www.googleapis.com/auth/adwords"];

function getDeveloperToken(): string {
  const token = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  if (!token) {
    throw new Error(
      "GOOGLE_ADS_DEVELOPER_TOKEN não configurado — solicite um developer token aprovado pelo Google antes de sincronizar.",
    );
  }
  return token;
}

function toMoney(micros: number): number {
  return Math.round((micros / 1_000_000) * 100) / 100;
}

async function googleAdsRequest<T>(
  path: string,
  credentials: GoogleAdsCredentials,
  init?: RequestInit,
): Promise<T> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${credentials.accessToken}`,
    "developer-token": getDeveloperToken(),
    "Content-Type": "application/json",
  };
  if (credentials.loginCustomerId) headers["login-customer-id"] = credentials.loginCustomerId;

  const response = await fetch(`${API_BASE}/${path}`, { ...init, headers });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      data?.error?.message ??
      data?.[0]?.error?.message ??
      `Erro ${response.status} na Google Ads API.`;
    throw new Error(message);
  }
  return data as T;
}

interface GaqlRow {
  [key: string]: unknown;
}

/** Executa uma consulta GAQL e devolve todas as páginas — a Google Ads API
 * pagina via `nextPageToken`, mesmo espírito do cursor `paging.next` da
 * Graph API (services/metaAds/metaMarketingProvider.ts::graphPaginate). */
async function gaqlSearch(
  credentials: GoogleAdsCredentials,
  customerId: string,
  query: string,
): Promise<GaqlRow[]> {
  const rows: GaqlRow[] = [];
  let pageToken: string | undefined;

  do {
    const body: Record<string, string> = { query };
    if (pageToken) body.pageToken = pageToken;

    const page = await googleAdsRequest<{ results?: GaqlRow[]; nextPageToken?: string }>(
      `customers/${customerId}/googleAds:search`,
      credentials,
      { method: "POST", body: JSON.stringify(body) },
    );
    rows.push(...(page.results ?? []));
    pageToken = page.nextPageToken;
  } while (pageToken);

  return rows;
}

function getPath(row: GaqlRow, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[key];
    return undefined;
  }, row);
}

function toNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** Única implementação real desta fase — chama a Google Ads API REST (GAQL)
 * diretamente. Nenhuma outra camada da aplicação importa este arquivo; tudo
 * passa por services/googleAds/googleAdsProviderFactory.ts. */
export class GoogleAdsRestClient implements GoogleAdsDataProvider {
  readonly name = "google_ads_rest_api";

  buildAuthorizeUrl(redirectUri: string, state: string): string {
    return buildGoogleAuthorizeUrl({ scopes: SCOPES, redirectUri, state });
  }

  async exchangeCodeForToken(code: string, redirectUri: string) {
    const result = await exchangeGoogleCode({ code, redirectUri });
    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresInSeconds: result.expiresInSeconds,
    };
  }

  async validateToken(credentials: GoogleAdsCredentials): Promise<ValidateGoogleAdsTokenResult> {
    try {
      await this.listAccessibleCustomers(credentials);
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Falha ao validar token.",
      };
    }
  }

  async listAccessibleCustomers(credentials: GoogleAdsCredentials): Promise<string[]> {
    const data = await googleAdsRequest<{ resourceNames?: string[] }>(
      "customers:listAccessibleCustomers",
      credentials,
    );
    return (data.resourceNames ?? []).map((name) => name.replace("customers/", ""));
  }

  async getCustomerInfo(
    credentials: GoogleAdsCredentials,
    customerId: string,
  ): Promise<RemoteGoogleAdsCustomer> {
    const rows = await gaqlSearch(
      credentials,
      customerId,
      "SELECT customer.descriptive_name, customer.currency_code, customer.time_zone, customer.manager FROM customer",
    );
    const row = rows[0];
    return {
      customerId,
      descriptiveName: (getPath(row, "customer.descriptiveName") as string) ?? null,
      currencyCode: (getPath(row, "customer.currencyCode") as string) ?? null,
      timeZone: (getPath(row, "customer.timeZone") as string) ?? null,
      isManager: Boolean(getPath(row, "customer.manager")),
    };
  }

  async listCampaigns(
    credentials: GoogleAdsCredentials,
    customerId: string,
  ): Promise<RemoteGoogleAdsCampaign[]> {
    const rows = await gaqlSearch(
      credentials,
      customerId,
      "SELECT campaign.id, campaign.name, campaign.advertising_channel_type, campaign.status, campaign_budget.amount_micros FROM campaign",
    );
    return rows.map((row) => ({
      campaignId: String(getPath(row, "campaign.id")),
      name: (getPath(row, "campaign.name") as string) ?? "",
      channelType: (getPath(row, "campaign.advertisingChannelType") as string) ?? null,
      status: (getPath(row, "campaign.status") as string) ?? "UNKNOWN",
      budgetAmountMicros: getPath(row, "campaignBudget.amountMicros")
        ? toNumber(getPath(row, "campaignBudget.amountMicros"))
        : null,
    }));
  }

  async listKeywords(
    credentials: GoogleAdsCredentials,
    customerId: string,
    campaignId: string,
  ): Promise<RemoteGoogleAdsKeyword[]> {
    const rows = await gaqlSearch(
      credentials,
      customerId,
      `SELECT ad_group_criterion.criterion_id, ad_group.name, ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type, ad_group_criterion.status, metrics.clicks, metrics.impressions, metrics.cost_micros FROM keyword_view WHERE campaign.id = ${campaignId}`,
    );
    return rows.map((row) => ({
      keywordId: String(getPath(row, "adGroupCriterion.criterionId")),
      campaignId,
      adGroupName: (getPath(row, "adGroup.name") as string) ?? null,
      text: (getPath(row, "adGroupCriterion.keyword.text") as string) ?? "",
      matchType: (getPath(row, "adGroupCriterion.keyword.matchType") as string) ?? null,
      status: (getPath(row, "adGroupCriterion.status") as string) ?? "UNKNOWN",
      clicks: toNumber(getPath(row, "metrics.clicks")),
      impressions: toNumber(getPath(row, "metrics.impressions")),
      costMicros: toNumber(getPath(row, "metrics.costMicros")),
    }));
  }

  async fetchDailyMetrics(
    credentials: GoogleAdsCredentials,
    customerId: string,
    input: FetchGoogleAdsMetricsInput,
  ): Promise<RemoteGoogleAdsDailyMetric[]> {
    const rows = await gaqlSearch(
      credentials,
      customerId,
      `SELECT segments.date, campaign.id, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions, metrics.conversions_value FROM campaign WHERE segments.date BETWEEN '${input.since}' AND '${input.until}'`,
    );
    return rows.map((row) => ({
      date: String(getPath(row, "segments.date")),
      campaignId: (getPath(row, "campaign.id") as string | number | undefined)?.toString() ?? null,
      impressions: toNumber(getPath(row, "metrics.impressions")),
      clicks: toNumber(getPath(row, "metrics.clicks")),
      costMicros: toNumber(getPath(row, "metrics.costMicros")),
      conversions: toNumber(getPath(row, "metrics.conversions")),
      conversionsValue: toNumber(getPath(row, "metrics.conversionsValue")),
    }));
  }
}

export { toMoney as microsToMoney };
