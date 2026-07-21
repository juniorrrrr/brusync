import type { ComponentType } from "react";
import type { IconProps } from "@/components/ui/icons";

export interface NavItem {
  label: string;
  href?: string;
  icon: ComponentType<IconProps>;
  soon?: boolean;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export type BadgeTone = "info" | "warn" | "ok" | "neutral" | "danger";

export interface PipelineStage {
  id: string;
  key: string;
  label: string;
  color: BadgeTone;
  position: number;
  isWon: boolean;
}

export interface OwnerRef {
  id: string;
  name: string | null;
  email: string | null;
}

export interface CrmLead {
  id: string;
  createdAt: string;
  updatedAt: string;
  sourceLeadId: string | null;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  origin: string | null;
  stageId: string;
  ownerId: string | null;
  potentialValue: number | null;
  score: number;
  tags: string[];
  lastInteractionAt: string | null;
  createdBy: string | null;
}

export interface CrmLeadWithRelations extends CrmLead {
  stage: PipelineStage;
  owner: OwnerRef | null;
}

export interface PipelineColumn {
  stage: PipelineStage;
  leads: CrmLeadWithRelations[];
}

export type ActivityType =
  | "note"
  | "stage_change"
  | "call"
  | "email"
  | "meeting"
  | "task"
  | "system";

export interface LeadActivity {
  id: string;
  crmLeadId: string;
  type: ActivityType;
  title: string;
  body: string | null;
  metadata: Record<string, unknown> | null;
  dueAt: string | null;
  done: boolean;
  createdBy: string | null;
  createdByName: string | null;
  createdAt: string;
}

export interface LeadFile {
  id: string;
  crmLeadId: string;
  storagePath: string;
  fileName: string;
  fileSize: number | null;
  mimeType: string | null;
  uploadedBy: string | null;
  createdAt: string;
}

export interface MaterialDownload {
  id: string;
  materialSlug: string;
  materialTitle: string;
  createdAt: string;
}

/** Attribution snapshot from public.leads (the marketing contact-form
 * capture) — shown read-only in the Lead Detail Drawer's "Origem / UTMs" tab
 * when a crm_lead has a sourceLeadId. */
export interface SourceLeadAttribution {
  id: string;
  createdAt: string;
  message: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmTerm: string | null;
  utmContent: string | null;
  gclid: string | null;
  fbclid: string | null;
  landingPage: string | null;
  referer: string | null;
  device: string | null;
  os: string | null;
  browser: string | null;
}

export type ClientStatus = "ativo" | "inativo" | "em_risco";

export interface ClientRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
  sourceCrmLeadId: string | null;
  company: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  ownerId: string | null;
  status: ClientStatus;
  createdBy: string | null;
}

export interface ClientWithOwner extends ClientRecord {
  owner: OwnerRef | null;
}
