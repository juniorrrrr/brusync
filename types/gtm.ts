export type GtmConnectionStatus = "conectado" | "desconectado" | "erro";
export type GtmEntityType = "workspace" | "tag" | "trigger" | "variable";

export interface GtmContainer {
  id: string;
  containerId: string;
  accountIdExternal: string | null;
  name: string | null;
  publicId: string | null;
  usageContext: string[];
  isSynced: boolean;
  status: GtmConnectionStatus;
  lastSyncAt: string | null;
  error: string | null;
  clientId: string | null;
  responsibleId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GtmEntity {
  id: string;
  containerId: string;
  entityType: GtmEntityType;
  externalId: string;
  workspaceExternalId: string | null;
  name: string | null;
  type: string | null;
  status: string | null;
}

export interface GtmVersion {
  id: string;
  containerId: string;
  versionExternalId: string;
  name: string | null;
  publishedAt: string | null;
}

export interface GtmDashboardData {
  container: GtmContainer | null;
  workspaceCount: number;
  tagCount: number;
  triggerCount: number;
  variableCount: number;
  entitiesByStatus: { active: number; paused: number };
  latestVersion: { name: string | null; publishedAt: string | null } | null;
  lastSyncAt: string | null;
}
