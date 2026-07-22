import type {
  ActivityType,
  BadgeTone,
  ClientRecord,
  ClientStatus,
  ClientWithOwner,
  CrmLead,
  CrmLeadWithRelations,
  LeadActivity,
  LeadFile,
  LeadNote,
  LeadTask,
  LostReason,
  MaterialDownload,
  OwnerRef,
  PipelineStage,
  StageHistoryRow,
  TaskPriority,
  TaskStatus,
} from "@/types/crm";

export interface PipelineStageRow {
  id: string;
  key: string;
  label: string;
  color: string;
  position: number;
  is_won: boolean;
}

export function mapPipelineStage(row: PipelineStageRow): PipelineStage {
  return {
    id: row.id,
    key: row.key,
    label: row.label,
    color: row.color as BadgeTone,
    position: row.position,
    isWon: row.is_won,
  };
}

export interface ProfileRow {
  id: string;
  name: string | null;
  email: string | null;
}

export function mapOwner(row: ProfileRow | null | undefined): OwnerRef | null {
  if (!row) return null;
  return { id: row.id, name: row.name, email: row.email };
}

export interface CrmLeadRow {
  id: string;
  created_at: string;
  updated_at: string;
  source_lead_id: string | null;
  name: string;
  company: string | null;
  job_title: string | null;
  city: string | null;
  email: string | null;
  phone: string | null;
  origin: string | null;
  stage_id: string;
  owner_id: string | null;
  potential_value: number | string | null;
  score: number;
  tags: string[] | null;
  last_interaction_at: string | null;
  created_by: string | null;
  lost_reason: string | null;
  lost_at: string | null;
}

export function mapCrmLead(row: CrmLeadRow): CrmLead {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    sourceLeadId: row.source_lead_id,
    name: row.name,
    company: row.company,
    jobTitle: row.job_title,
    city: row.city,
    email: row.email,
    phone: row.phone,
    origin: row.origin,
    stageId: row.stage_id,
    ownerId: row.owner_id,
    potentialValue: row.potential_value == null ? null : Number(row.potential_value),
    score: row.score,
    tags: row.tags ?? [],
    lastInteractionAt: row.last_interaction_at,
    createdBy: row.created_by,
    lostReason: row.lost_reason as LostReason | null,
    lostAt: row.lost_at,
  };
}

export interface CrmLeadWithRelationsRow extends CrmLeadRow {
  stage: PipelineStageRow;
  owner: ProfileRow | null;
}

export function mapCrmLeadWithRelations(row: CrmLeadWithRelationsRow): CrmLeadWithRelations {
  return {
    ...mapCrmLead(row),
    stage: mapPipelineStage(row.stage),
    owner: mapOwner(row.owner),
  };
}

export interface LeadActivityRow {
  id: string;
  crm_lead_id: string;
  type: string;
  title: string;
  body: string | null;
  metadata: Record<string, unknown> | null;
  due_at: string | null;
  done: boolean;
  created_by: string | null;
  created_at: string;
  author?: ProfileRow | null;
}

export function mapLeadActivity(row: LeadActivityRow): LeadActivity {
  return {
    id: row.id,
    crmLeadId: row.crm_lead_id,
    type: row.type as ActivityType,
    title: row.title,
    body: row.body,
    metadata: row.metadata,
    dueAt: row.due_at,
    done: row.done,
    createdBy: row.created_by,
    createdByName: row.author?.name ?? row.author?.email ?? null,
    createdAt: row.created_at,
  };
}

export interface LeadNoteRow {
  id: string;
  crm_lead_id: string;
  body: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  author?: ProfileRow | null;
}

export function mapLeadNote(row: LeadNoteRow): LeadNote {
  return {
    id: row.id,
    crmLeadId: row.crm_lead_id,
    body: row.body,
    createdBy: row.created_by,
    createdByName: row.author?.name ?? row.author?.email ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface LeadTaskRow {
  id: string;
  crm_lead_id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_at: string | null;
  completed_at: string | null;
  assignee_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  assignee?: ProfileRow | null;
}

export function mapLeadTask(row: LeadTaskRow): LeadTask {
  return {
    id: row.id,
    crmLeadId: row.crm_lead_id,
    title: row.title,
    description: row.description,
    status: row.status as TaskStatus,
    priority: row.priority as TaskPriority,
    dueAt: row.due_at,
    completedAt: row.completed_at,
    assigneeId: row.assignee_id,
    assignee: mapOwner(row.assignee),
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface LeadFileRow {
  id: string;
  crm_lead_id: string;
  storage_path: string;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  uploaded_by: string | null;
  created_at: string;
}

export function mapLeadFile(row: LeadFileRow): LeadFile {
  return {
    id: row.id,
    crmLeadId: row.crm_lead_id,
    storagePath: row.storage_path,
    fileName: row.file_name,
    fileSize: row.file_size,
    mimeType: row.mime_type,
    uploadedBy: row.uploaded_by,
    createdAt: row.created_at,
  };
}

export interface MaterialLeadRow {
  id: string;
  material_slug: string;
  material_title: string;
  created_at: string;
}

export function mapMaterialDownload(row: MaterialLeadRow): MaterialDownload {
  return {
    id: row.id,
    materialSlug: row.material_slug,
    materialTitle: row.material_title,
    createdAt: row.created_at,
  };
}

export interface ClientRow {
  id: string;
  created_at: string;
  updated_at: string;
  source_crm_lead_id: string | null;
  company: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  owner_id: string | null;
  status: string;
  created_by: string | null;
}

export function mapClient(row: ClientRow): ClientRecord {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    sourceCrmLeadId: row.source_crm_lead_id,
    company: row.company,
    name: row.name,
    email: row.email,
    phone: row.phone,
    ownerId: row.owner_id,
    status: row.status as ClientStatus,
    createdBy: row.created_by,
  };
}

export interface ClientWithOwnerRow extends ClientRow {
  owner: ProfileRow | null;
}

export function mapClientWithOwner(row: ClientWithOwnerRow): ClientWithOwner {
  return { ...mapClient(row), owner: mapOwner(row.owner) };
}

export interface StageHistoryDbRow {
  id: string;
  crm_lead_id: string;
  stage_id: string;
  entered_at: string;
  exited_at: string | null;
}

export function mapStageHistory(row: StageHistoryDbRow): StageHistoryRow {
  return {
    id: row.id,
    crmLeadId: row.crm_lead_id,
    stageId: row.stage_id,
    enteredAt: row.entered_at,
    exitedAt: row.exited_at,
  };
}
