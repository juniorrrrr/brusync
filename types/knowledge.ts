export type KnowledgeContentType =
  | "documento"
  | "playbook"
  | "checklist"
  | "faq"
  | "procedimento"
  | "politica"
  | "treinamento"
  | "script_comercial"
  | "template"
  | "contrato"
  | "arquivo"
  | "link_externo"
  | "video";

export type KnowledgeDocumentStatus = "rascunho" | "em_revisao" | "publicado" | "arquivado";

export type KnowledgeCategoryColor = "info" | "warn" | "ok" | "neutral" | "danger";

export type KnowledgeFileKind =
  | "imagem"
  | "pdf"
  | "docx"
  | "planilha"
  | "apresentacao"
  | "zip"
  | "video"
  | "outro";

export type KnowledgeViewAction = "view" | "download";

/** One block of the rich editor's content_json array — see
 * domain/knowledge/blocks.ts for the full per-type payload shapes. */
export interface KnowledgeBlock {
  id: string;
  type:
    | "heading"
    | "subheading"
    | "paragraph"
    | "list"
    | "checklist"
    | "table"
    | "code"
    | "alert"
    | "image"
    | "video"
    | "attachment"
    | "link";
  data: Record<string, unknown>;
}

export interface KnowledgeCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string;
  color: KnowledgeCategoryColor;
  isDefault: boolean;
  sortOrder: number;
  documentCount: number;
  createdAt: string;
}

export interface KnowledgeTag {
  id: string;
  name: string;
  slug: string;
}

export interface KnowledgeLinkedEntities {
  clientId: string | null;
  clientCompany: string | null;
  projectId: string | null;
  projectName: string | null;
  crmLeadId: string | null;
  crmLeadName: string | null;
  conversationId: string | null;
  automationId: string | null;
  automationName: string | null;
  integrationId: string | null;
  integrationName: string | null;
  financialTransactionId: string | null;
  financialTransactionDescription: string | null;
}

export interface KnowledgeDocumentSummary {
  id: string;
  title: string;
  slug: string;
  contentType: KnowledgeContentType;
  status: KnowledgeDocumentStatus;
  summary: string | null;
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: KnowledgeCategoryColor | null;
  categoryIcon: string | null;
  tags: KnowledgeTag[];
  viewCount: number;
  isFavorite: boolean;
  isPinned: boolean;
  createdBy: string | null;
  createdByName: string | null;
  updatedAt: string;
  createdAt: string;
  publishedAt: string | null;
}

export interface KnowledgeDocumentDetail extends KnowledgeDocumentSummary, KnowledgeLinkedEntities {
  contentJson: KnowledgeBlock[];
  externalUrl: string | null;
  currentVersion: number;
  updatedByName: string | null;
  publishedByName: string | null;
  files: KnowledgeFile[];
}

export interface KnowledgeFile {
  id: string;
  documentId: string | null;
  storagePath: string;
  fileName: string;
  fileSize: number | null;
  mimeType: string | null;
  kind: KnowledgeFileKind;
  uploadedByName: string | null;
  createdAt: string;
}

export interface KnowledgeVersion {
  id: string;
  documentId: string;
  versionNumber: number;
  title: string;
  contentJson: KnowledgeBlock[];
  summary: string | null;
  changeNote: string | null;
  createdByName: string | null;
  createdAt: string;
}

export interface KnowledgeViewEntry {
  id: string;
  documentId: string;
  documentTitle: string;
  fileId: string | null;
  fileName: string | null;
  action: KnowledgeViewAction;
  userName: string | null;
  viewedAt: string;
}

export interface KnowledgePermission {
  id: string;
  documentId: string | null;
  categoryId: string | null;
  profileId: string | null;
  profileName: string | null;
  role: string | null;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canPublish: boolean;
  canApprove: boolean;
  canDuplicate: boolean;
  canFavorite: boolean;
}

/** Effective, resolved permission set for the current profile on a given
 * document — computed by services/knowledge/knowledgePermissionService.ts
 * from role defaults + crm_knowledge_permissions overrides. */
export interface KnowledgeEffectivePermissions {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canPublish: boolean;
  canApprove: boolean;
  canDuplicate: boolean;
  canFavorite: boolean;
}

export interface KnowledgeDashboardData {
  documentsCount: number;
  categoriesCount: number;
  filesCount: number;
  viewsCount: number;
  favoritesCount: number;
  publishedCount: number;
  draftCount: number;
  recentDocuments: KnowledgeDocumentSummary[];
  recentlyUpdated: KnowledgeDocumentSummary[];
  mostAccessed: KnowledgeDocumentSummary[];
  staleDocuments: KnowledgeDocumentSummary[];
  categoryUsage: { categoryName: string; documentCount: number; viewCount: number }[];
}

export interface KnowledgeSearchResult {
  id: string;
  title: string;
  summary: string | null;
  contentType: KnowledgeContentType;
  status: KnowledgeDocumentStatus;
  categoryName: string | null;
  matchedIn: (
    | "titulo"
    | "conteudo"
    | "categoria"
    | "tag"
    | "autor"
    | "cliente"
    | "projeto"
    | "lead"
    | "arquivo"
  )[];
  updatedAt: string;
}

export interface KnowledgeTemplate {
  key: string;
  name: string;
  description: string;
  contentType: KnowledgeContentType;
  blocks: KnowledgeBlock[];
}
