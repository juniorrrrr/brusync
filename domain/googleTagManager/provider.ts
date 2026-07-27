/** Camada de abstração da Google Tag Manager API v2 (Fase 35) — mesmo
 * espírito de domain/metaAds/provider.ts (Fase 29): nenhuma camada da
 * aplicação fala REST diretamente, tudo passa por esta interface. */

export interface GtmCredentials {
  accessToken: string;
}

export interface ValidateGtmTokenResult {
  ok: boolean;
  error?: string;
}

export interface RemoteGtmAccount {
  accountId: string;
  name: string | null;
}

export interface RemoteGtmContainer {
  accountId: string;
  containerId: string;
  name: string | null;
  publicId: string | null;
  usageContext: string[];
}

export interface RemoteGtmWorkspace {
  workspaceId: string;
  name: string | null;
}

export interface RemoteGtmEntity {
  externalId: string;
  name: string | null;
  type: string | null;
  status: string | null;
}

export interface RemoteGtmVersion {
  versionId: string;
  name: string | null;
  publishedAt: string | null;
}

/** Toda implementação recebe credenciais já resolvidas por quem a
 * instancia — nunca lê variável de ambiente por conta própria, exceto
 * GOOGLE_CLIENT_ID/SECRET (resolvidos em services/googleIntegrations/
 * googleOAuthClient.ts, não aqui). */
export interface GtmDataProvider {
  readonly name: string;

  validateToken(credentials: GtmCredentials): Promise<ValidateGtmTokenResult>;
  listAccounts(credentials: GtmCredentials): Promise<RemoteGtmAccount[]>;
  listContainers(credentials: GtmCredentials, accountId: string): Promise<RemoteGtmContainer[]>;
  listWorkspaces(
    credentials: GtmCredentials,
    accountId: string,
    containerId: string,
  ): Promise<RemoteGtmWorkspace[]>;
  listTags(
    credentials: GtmCredentials,
    accountId: string,
    containerId: string,
    workspaceId: string,
  ): Promise<RemoteGtmEntity[]>;
  listTriggers(
    credentials: GtmCredentials,
    accountId: string,
    containerId: string,
    workspaceId: string,
  ): Promise<RemoteGtmEntity[]>;
  listVariables(
    credentials: GtmCredentials,
    accountId: string,
    containerId: string,
    workspaceId: string,
  ): Promise<RemoteGtmEntity[]>;
  listVersions(
    credentials: GtmCredentials,
    accountId: string,
    containerId: string,
  ): Promise<RemoteGtmVersion[]>;
}
