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

export type LostReason =
  | "preco"
  | "sem_interesse"
  | "concorrente"
  | "sem_orcamento"
  | "nao_respondeu"
  | "sem_perfil"
  | "outro";

export interface CrmLead {
  id: string;
  createdAt: string;
  updatedAt: string;
  sourceLeadId: string | null;
  name: string;
  company: string | null;
  jobTitle: string | null;
  city: string | null;
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
  lostReason: LostReason | null;
  lostAt: string | null;
}

export interface CrmLeadWithRelations extends CrmLead {
  stage: PipelineStage;
  owner: OwnerRef | null;
}

/** The lead's current stage-history entry (the open row — exitedAt null).
 * Gives "data de entrada" and "tempo parado nesta etapa" for the Pipeline
 * card without a per-card extra query. */
export interface StageEntry {
  stageId: string;
  enteredAt: string;
}

export interface CrmLeadWithPipelineInfo extends CrmLeadWithRelations {
  stageEnteredAt: string | null;
  nextTask: LeadTaskSummary | null;
}

export interface StageHistoryRow {
  id: string;
  crmLeadId: string;
  stageId: string;
  enteredAt: string;
  exitedAt: string | null;
}

export interface LeadTaskSummary {
  id: string;
  title: string;
  dueAt: string | null;
  priority: TaskPriority;
  assignee: OwnerRef | null;
}

export interface PipelineColumn {
  stage: PipelineStage;
  leads: CrmLeadWithPipelineInfo[];
}

export type ActivityType =
  | "note"
  | "stage_change"
  | "call"
  | "email"
  | "meeting"
  | "task"
  | "system"
  | "lead_updated"
  | "owner_change"
  | "note_created"
  | "note_updated"
  | "note_deleted"
  | "task_created"
  | "task_updated"
  | "task_completed"
  | "task_deleted"
  | "file_upload"
  | "file_delete"
  | "automation"
  | "lead_lost"
  | "lead_reopened"
  | "client_created"
  | "conversation_started"
  | "conversation_closed"
  | "message_sent"
  | "message_received"
  | "conversation_owner_changed";

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

/** A single row in the read-only Timeline — either a crm_lead_activities
 * entry, or a material download (from public.material_leads, matched by
 * email) folded in so the two sources render as one chronological feed. */
export type TimelineEntry =
  | { source: "activity"; activity: LeadActivity }
  | { source: "download"; download: MaterialDownload };

export type TaskStatus = "pending" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high";

export interface LeadNote {
  id: string;
  crmLeadId: string;
  body: string;
  createdBy: string | null;
  createdByName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeadTask {
  id: string;
  crmLeadId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueAt: string | null;
  completedAt: string | null;
  assigneeId: string | null;
  assignee: OwnerRef | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
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
  msclkid: string | null;
  ttclid: string | null;
  landingPage: string | null;
  referer: string | null;
  device: string | null;
  os: string | null;
  browser: string | null;
  language: string | null;
  firstVisit: string | null;
  lastVisit: string | null;
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
