import "server-only";

import type { MetaEventPayload } from "@/domain/metaConversionsApi/payload";

const META_API_VERSION = "v21.0";

export interface MetaApiResult {
  ok: boolean;
  httpStatus: number;
  body: unknown;
}

/** The only place in Brusync that actually talks to graph.facebook.com.
 * Called exclusively from services/conversionsHub/dispatchMetaDelivery.ts —
 * never directly from a Server Action or the CRM, so every real send still
 * passes through the Conversions Hub's queue/attempt bookkeeping. */
export async function sendMetaEvent(
  pixelId: string,
  accessToken: string,
  payload: MetaEventPayload,
): Promise<MetaApiResult> {
  const url = `https://graph.facebook.com/${META_API_VERSION}/${pixelId}/events`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, access_token: accessToken }),
    });

    const body = await response.json().catch(() => null);
    return { ok: response.ok, httpStatus: response.status, body };
  } catch (err) {
    return {
      ok: false,
      httpStatus: 0,
      body: {
        error: { message: err instanceof Error ? err.message : "Falha de rede desconhecida." },
      },
    };
  }
}

/** "Testar conexão" — a safe, read-only call that just resolves the Pixel ID
 * against the given token, returning its name. Doesn't send any event. */
export async function fetchMetaPixelInfo(
  pixelId: string,
  accessToken: string,
): Promise<MetaApiResult> {
  const url = `https://graph.facebook.com/${META_API_VERSION}/${pixelId}?fields=id,name&access_token=${encodeURIComponent(accessToken)}`;

  try {
    const response = await fetch(url, { method: "GET" });
    const body = await response.json().catch(() => null);
    return { ok: response.ok, httpStatus: response.status, body };
  } catch (err) {
    return {
      ok: false,
      httpStatus: 0,
      body: {
        error: { message: err instanceof Error ? err.message : "Falha de rede desconhecida." },
      },
    };
  }
}
