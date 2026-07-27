import "server-only";

const AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const REVOKE_URL = "https://oauth2.googleapis.com/revoke";

/** One shared Google OAuth2 client (Fase 35) reused by all four Google
 * integrations (Google Ads, GA4, Google Tag Manager, Search Console) — each
 * still connects/disconnects independently (its own token row, its own
 * account selection, its own sync engine), but they all authenticate
 * against the same Google Cloud OAuth client (GOOGLE_CLIENT_ID/
 * GOOGLE_CLIENT_SECRET), same as how a real multi-product Google
 * integration is normally registered in the Google Cloud Console — just
 * with different scopes requested per product. Mirrors the shape of
 * services/metaAds/metaAdsOAuthService.ts's buildAuthorizeUrl/
 * exchangeCodeForToken, generalized instead of duplicated four times. */

export function getGoogleClientCredentials(): { clientId: string; clientSecret: string } | null {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

export function isGoogleOAuthConfigured(): boolean {
  return getGoogleClientCredentials() !== null;
}

export function buildGoogleAuthorizeUrl(params: {
  scopes: string[];
  redirectUri: string;
  state: string;
}): string {
  const credentials = getGoogleClientCredentials();
  if (!credentials) {
    throw new Error(
      "GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET não configurados — cadastre um OAuth Client no Google Cloud Console antes de conectar.",
    );
  }

  const url = new URL(AUTHORIZE_URL);
  url.searchParams.set("client_id", credentials.clientId);
  url.searchParams.set("redirect_uri", params.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", params.scopes.join(" "));
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("include_granted_scopes", "true");
  url.searchParams.set("state", params.state);
  return url.toString();
}

export interface GoogleTokenResponse {
  accessToken: string;
  refreshToken: string | null;
  expiresInSeconds: number;
  scope: string;
}

async function requestGoogleToken(body: Record<string, string>): Promise<GoogleTokenResponse> {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body).toString(),
  });

  const payload = (await response.json().catch(() => ({}))) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string;
    error_description?: string;
    error?: string;
  };

  if (!response.ok || !payload.access_token) {
    throw new Error(
      payload.error_description ??
        payload.error ??
        `Falha ao obter token do Google (${response.status}).`,
    );
  }

  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token ?? null,
    expiresInSeconds: payload.expires_in ?? 3600,
    scope: payload.scope ?? "",
  };
}

export async function exchangeGoogleCode(params: {
  code: string;
  redirectUri: string;
}): Promise<GoogleTokenResponse> {
  const credentials = getGoogleClientCredentials();
  if (!credentials) throw new Error("GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET não configurados.");

  return requestGoogleToken({
    code: params.code,
    client_id: credentials.clientId,
    client_secret: credentials.clientSecret,
    redirect_uri: params.redirectUri,
    grant_type: "authorization_code",
  });
}

/** Access tokens expire in ~1h — every real sync call goes through this
 * first (each product's *AccountService.getDecryptedAccessToken equivalent)
 * so "renovação automática" never depends on the user noticing. */
export async function refreshGoogleAccessToken(refreshToken: string): Promise<GoogleTokenResponse> {
  const credentials = getGoogleClientCredentials();
  if (!credentials) throw new Error("GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET não configurados.");

  return requestGoogleToken({
    refresh_token: refreshToken,
    client_id: credentials.clientId,
    client_secret: credentials.clientSecret,
    grant_type: "refresh_token",
  });
}

/** "Revogação" — called from each product's disconnect(); best-effort, a
 * network failure here should never block the local disconnect. */
export async function revokeGoogleToken(token: string): Promise<void> {
  await fetch(REVOKE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ token }).toString(),
  }).catch(() => undefined);
}
