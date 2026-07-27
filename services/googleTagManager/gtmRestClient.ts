import "server-only";

import type {
  GtmCredentials,
  GtmDataProvider,
  RemoteGtmAccount,
  RemoteGtmContainer,
  RemoteGtmEntity,
  RemoteGtmVersion,
  RemoteGtmWorkspace,
  ValidateGtmTokenResult,
} from "@/domain/googleTagManager/provider";

const API_BASE = "https://www.googleapis.com/tagmanager/v2";

async function gtmRequest<T>(path: string, accessToken: string): Promise<T> {
  const response = await fetch(`${API_BASE}/${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = data?.error?.message ?? `Erro ${response.status} na Tag Manager API.`;
    throw new Error(message);
  }
  return data as T;
}

/** Implementação real (fetch-based, sem SDK) — mesmo padrão de
 * services/metaAds/metaMarketingProvider.ts. A v2 não expõe um "publishedAt"
 * direto na listagem de versões — usamos a data de criação como melhor
 * aproximação disponível sem uma chamada extra por versão. */
export class GoogleTagManagerRestClient implements GtmDataProvider {
  readonly name = "gtm_v2_api";

  async validateToken(credentials: GtmCredentials): Promise<ValidateGtmTokenResult> {
    try {
      await gtmRequest("accounts?pageSize=1", credentials.accessToken);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "Token inválido." };
    }
  }

  async listAccounts(credentials: GtmCredentials): Promise<RemoteGtmAccount[]> {
    const data = await gtmRequest<{ account?: { accountId: string; name?: string }[] }>(
      "accounts",
      credentials.accessToken,
    );
    return (data.account ?? []).map((a) => ({ accountId: a.accountId, name: a.name ?? null }));
  }

  async listContainers(
    credentials: GtmCredentials,
    accountId: string,
  ): Promise<RemoteGtmContainer[]> {
    const data = await gtmRequest<{
      container?: {
        containerId: string;
        name?: string;
        publicId?: string;
        usageContext?: string[];
      }[];
    }>(`accounts/${accountId}/containers`, credentials.accessToken);
    return (data.container ?? []).map((c) => ({
      accountId,
      containerId: c.containerId,
      name: c.name ?? null,
      publicId: c.publicId ?? null,
      usageContext: c.usageContext ?? [],
    }));
  }

  async listWorkspaces(
    credentials: GtmCredentials,
    accountId: string,
    containerId: string,
  ): Promise<RemoteGtmWorkspace[]> {
    const data = await gtmRequest<{ workspace?: { workspaceId: string; name?: string }[] }>(
      `accounts/${accountId}/containers/${containerId}/workspaces`,
      credentials.accessToken,
    );
    return (data.workspace ?? []).map((w) => ({
      workspaceId: w.workspaceId,
      name: w.name ?? null,
    }));
  }

  async listTags(
    credentials: GtmCredentials,
    accountId: string,
    containerId: string,
    workspaceId: string,
  ): Promise<RemoteGtmEntity[]> {
    const data = await gtmRequest<{ tag?: { tagId: string; name?: string; type?: string }[] }>(
      `accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}/tags`,
      credentials.accessToken,
    );
    return (data.tag ?? []).map((t) => ({
      externalId: t.tagId,
      name: t.name ?? null,
      type: t.type ?? null,
      status: null,
    }));
  }

  async listTriggers(
    credentials: GtmCredentials,
    accountId: string,
    containerId: string,
    workspaceId: string,
  ): Promise<RemoteGtmEntity[]> {
    const data = await gtmRequest<{
      trigger?: { triggerId: string; name?: string; type?: string }[];
    }>(
      `accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}/triggers`,
      credentials.accessToken,
    );
    return (data.trigger ?? []).map((t) => ({
      externalId: t.triggerId,
      name: t.name ?? null,
      type: t.type ?? null,
      status: null,
    }));
  }

  async listVariables(
    credentials: GtmCredentials,
    accountId: string,
    containerId: string,
    workspaceId: string,
  ): Promise<RemoteGtmEntity[]> {
    const data = await gtmRequest<{
      variable?: { variableId: string; name?: string; type?: string }[];
    }>(
      `accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}/variables`,
      credentials.accessToken,
    );
    return (data.variable ?? []).map((v) => ({
      externalId: v.variableId,
      name: v.name ?? null,
      type: v.type ?? null,
      status: null,
    }));
  }

  async listVersions(
    credentials: GtmCredentials,
    accountId: string,
    containerId: string,
  ): Promise<RemoteGtmVersion[]> {
    const data = await gtmRequest<{
      containerVersion?: { containerVersionId: string; name?: string; fingerprint?: string }[];
    }>(`accounts/${accountId}/containers/${containerId}/versions`, credentials.accessToken);
    return (data.containerVersion ?? []).map((v) => ({
      versionId: v.containerVersionId,
      name: v.name ?? null,
      // A v2 não devolve um timestamp de publicação na listagem — fingerprint
      // é um epoch-ms de última modificação, melhor aproximação disponível
      // sem uma chamada get() por versão (fora do escopo consolidado desta
      // fase). Documentado em types/gtm.ts::GtmVersion.publishedAt.
      publishedAt: v.fingerprint ? new Date(Number(v.fingerprint)).toISOString() : null,
    }));
  }
}
