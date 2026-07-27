import "server-only";

import type {
  Ga4Credentials,
  Ga4DataProvider,
  Ga4ReportRange,
  RemoteGa4DimensionRow,
  RemoteGa4OverviewRow,
  RemoteGa4Property,
  ValidateGa4TokenResult,
} from "@/domain/ga4/provider";

const ADMIN_API_BASE = "https://analyticsadmin.googleapis.com/v1beta";
const DATA_API_BASE = "https://analyticsdata.googleapis.com/v1beta";

interface RunReportResponse {
  dimensionHeaders?: { name: string }[];
  metricHeaders?: { name: string }[];
  rows?: { dimensionValues?: { value: string }[]; metricValues?: { value: string }[] }[];
}

interface AccountSummariesResponse {
  accountSummaries?: {
    account: string;
    displayName: string;
    propertySummaries?: {
      property: string;
      displayName: string;
      propertyType?: string;
    }[];
  }[];
}

async function ga4Request<T>(url: string, accessToken: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = data?.error?.message ?? `Erro ${response.status} na API do GA4.`;
    throw new Error(message);
  }
  return data as T;
}

function toNumber(value: string | undefined): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** Extrai o número da propriedade a partir de `properties/123456`. */
function propertyIdFromResourceName(resourceName: string): string {
  return resourceName.replace(/^properties\//, "");
}

async function runReport(
  accessToken: string,
  propertyId: string,
  body: Record<string, unknown>,
): Promise<RunReportResponse> {
  return ga4Request<RunReportResponse>(
    `${DATA_API_BASE}/properties/${propertyId}:runReport`,
    accessToken,
    { method: "POST", body: JSON.stringify(body) },
  );
}

function rangeBody(range: Ga4ReportRange, dimensions: string[], metrics: string[]) {
  return {
    dateRanges: [{ startDate: range.since, endDate: range.until }],
    dimensions: dimensions.map((name) => ({ name })),
    metrics: metrics.map((name) => ({ name })),
  };
}

const OVERVIEW_METRICS = [
  "sessions",
  "totalUsers",
  "newUsers",
  "engagedSessions",
  "engagementRate",
  "screenPageViews",
  "conversions",
  "totalRevenue",
];

/** Implementação real (fetch-based, sem SDK) — mesmo padrão de
 * services/metaAds/metaMarketingProvider.ts. Só é de fato exercitada quando
 * GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET estão configurados e um usuário
 * concluiu o OAuth; nenhuma chamada acontece em Modo Demonstração. */
export class GoogleAnalyticsRestProvider implements Ga4DataProvider {
  readonly name = "ga4_data_admin_api";

  async validateToken(credentials: Ga4Credentials): Promise<ValidateGa4TokenResult> {
    try {
      await ga4Request(`${ADMIN_API_BASE}/accountSummaries?pageSize=1`, credentials.accessToken);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "Token inválido." };
    }
  }

  async listProperties(credentials: Ga4Credentials): Promise<RemoteGa4Property[]> {
    const properties: RemoteGa4Property[] = [];
    let pageToken: string | undefined;

    do {
      const url = new URL(`${ADMIN_API_BASE}/accountSummaries`);
      url.searchParams.set("pageSize", "200");
      if (pageToken) url.searchParams.set("pageToken", pageToken);

      const page: AccountSummariesResponse & { nextPageToken?: string } = await ga4Request(
        url.toString(),
        credentials.accessToken,
      );

      for (const account of page.accountSummaries ?? []) {
        for (const property of account.propertySummaries ?? []) {
          properties.push({
            propertyId: propertyIdFromResourceName(property.property),
            displayName: property.displayName ?? null,
            timeZone: null,
            currencyCode: null,
          });
        }
      }
      pageToken = page.nextPageToken;
    } while (pageToken);

    return properties;
  }

  async runOverviewReport(
    credentials: Ga4Credentials,
    propertyId: string,
    range: Ga4ReportRange,
  ): Promise<RemoteGa4OverviewRow[]> {
    const body = rangeBody(range, ["date"], OVERVIEW_METRICS);
    const response = await runReport(credentials.accessToken, propertyId, body);

    return (response.rows ?? []).map((row) => {
      const [date] = row.dimensionValues ?? [];
      const [
        sessions,
        users,
        newUsers,
        engagedSessions,
        engagementRate,
        pageViews,
        conversions,
        revenue,
      ] = row.metricValues ?? [];
      return {
        date: formatGa4Date(date?.value ?? ""),
        sessions: toNumber(sessions?.value),
        users: toNumber(users?.value),
        newUsers: toNumber(newUsers?.value),
        engagedSessions: toNumber(engagedSessions?.value),
        engagementRate: engagementRate?.value ? toNumber(engagementRate.value) : null,
        pageViews: toNumber(pageViews?.value),
        conversions: toNumber(conversions?.value),
        revenue: toNumber(revenue?.value),
      };
    });
  }

  async runChannelBreakdownReport(
    credentials: Ga4Credentials,
    propertyId: string,
    range: Ga4ReportRange,
  ) {
    return this.runDimensionReport(credentials, propertyId, range, "sessionDefaultChannelGroup");
  }

  async runDeviceBreakdownReport(
    credentials: Ga4Credentials,
    propertyId: string,
    range: Ga4ReportRange,
  ) {
    return this.runDimensionReport(credentials, propertyId, range, "deviceCategory");
  }

  private async runDimensionReport(
    credentials: Ga4Credentials,
    propertyId: string,
    range: Ga4ReportRange,
    dimensionName: string,
  ): Promise<RemoteGa4DimensionRow[]> {
    const body = rangeBody(
      range,
      ["date", dimensionName],
      ["sessions", "totalUsers", "conversions"],
    );
    const response = await runReport(credentials.accessToken, propertyId, body);

    return (response.rows ?? []).map((row) => {
      const [date, dimensionValue] = row.dimensionValues ?? [];
      const [sessions, users, conversions] = row.metricValues ?? [];
      return {
        date: formatGa4Date(date?.value ?? ""),
        dimensionValue: dimensionValue?.value ?? "(não definido)",
        sessions: toNumber(sessions?.value),
        users: toNumber(users?.value),
        conversions: toNumber(conversions?.value),
      };
    });
  }
}

/** A Data API devolve datas como "20260726" (YYYYMMDD) — normaliza para
 * "2026-07-26" antes de gravar em uma coluna `date`. */
function formatGa4Date(raw: string): string {
  if (/^\d{8}$/.test(raw)) return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
  return raw;
}
