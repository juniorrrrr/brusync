import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { slugify } from "@/domain/knowledge/types";
import type {
  KnowledgeBlock,
  KnowledgeCategoryColor,
  KnowledgeContentType,
  KnowledgeDocumentStatus,
} from "@/types/knowledge";

interface NamedRef {
  id: string;
  name?: string | null;
  company?: string | null;
  description?: string | null;
}
interface ProfileRef {
  name: string | null;
  email: string | null;
}
interface CategoryRef {
  id: string;
  name: string;
  color: KnowledgeCategoryColor;
  icon: string;
}

export interface DocumentBaseRow {
  id: string;
  category_id: string | null;
  title: string;
  slug: string;
  content_type: KnowledgeContentType;
  status: KnowledgeDocumentStatus;
  summary: string | null;
  current_version: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  created_by: string | null;
  category: CategoryRef | null;
  creator: ProfileRef | null;
}

export interface DocumentDetailRow extends DocumentBaseRow {
  content_json: KnowledgeBlock[];
  content_text: string;
  external_url: string | null;
  client_id: string | null;
  project_id: string | null;
  crm_lead_id: string | null;
  conversation_id: string | null;
  automation_id: string | null;
  integration_id: string | null;
  financial_transaction_id: string | null;
  published_by: string | null;
  updated_by: string | null;
  client: NamedRef | null;
  project: NamedRef | null;
  crm_lead: NamedRef | null;
  automation: NamedRef | null;
  integration: NamedRef | null;
  financial_transaction: NamedRef | null;
  updater: ProfileRef | null;
  publisher: ProfileRef | null;
}

const BASE_SELECT = `
  id, category_id, title, slug, content_type, status, summary, current_version,
  created_at, updated_at, published_at, created_by,
  category:crm_knowledge_categories!crm_knowledge_documents_category_id_fkey (id, name, color, icon),
  creator:profiles!crm_knowledge_documents_created_by_fkey (name, email)
`;

const DETAIL_SELECT = `
  ${BASE_SELECT},
  content_json, content_text, external_url,
  client_id, project_id, crm_lead_id, conversation_id, automation_id, integration_id,
  financial_transaction_id, published_by, updated_by,
  client:clients!crm_knowledge_documents_client_id_fkey (id, company),
  project:crm_projects!crm_knowledge_documents_project_id_fkey (id, name),
  crm_lead:crm_leads!crm_knowledge_documents_crm_lead_id_fkey (id, name),
  automation:automation_workflows!crm_knowledge_documents_automation_id_fkey (id, name),
  integration:integrations!crm_knowledge_documents_integration_id_fkey (id, name),
  financial_transaction:crm_financial_transactions!crm_knowledge_documents_financial_transaction_id_fkey (id, description),
  updater:profiles!crm_knowledge_documents_updated_by_fkey (name, email),
  publisher:profiles!crm_knowledge_documents_published_by_fkey (name, email)
`;

export interface ListDocumentsOptions {
  search?: string;
  categoryId?: string;
  status?: KnowledgeDocumentStatus;
  contentType?: KnowledgeContentType;
  clientId?: string;
  projectId?: string;
  crmLeadId?: string;
  documentIds?: string[];
  limit?: number;
  offset?: number;
}

export interface DocumentsPage {
  rows: DocumentBaseRow[];
  total: number;
}

export async function listDocuments(
  supabase: SupabaseClient,
  options: ListDocumentsOptions = {},
): Promise<DocumentsPage> {
  let query = supabase
    .from("crm_knowledge_documents")
    .select(BASE_SELECT, { count: "exact" })
    .is("deleted_at", null);

  if (options.categoryId) query = query.eq("category_id", options.categoryId);
  if (options.status) query = query.eq("status", options.status);
  if (options.contentType) query = query.eq("content_type", options.contentType);
  if (options.clientId) query = query.eq("client_id", options.clientId);
  if (options.projectId) query = query.eq("project_id", options.projectId);
  if (options.crmLeadId) query = query.eq("crm_lead_id", options.crmLeadId);
  if (options.documentIds) query = query.in("id", options.documentIds);
  if (options.search) {
    const term = options.search.replace(/[,()%]/g, " ").trim();
    if (term)
      query = query.textSearch("search_vector", term, { type: "websearch", config: "portuguese" });
  }

  const { data, error, count } = await query
    .order("updated_at", { ascending: false })
    .range(options.offset ?? 0, (options.offset ?? 0) + (options.limit ?? 50) - 1);

  if (error) throw new Error(`Falha ao carregar documentos: ${error.message}`);
  const rows = (data ?? []) as unknown as DocumentBaseRow[];
  return { rows, total: count ?? rows.length };
}

export async function getDocumentById(
  supabase: SupabaseClient,
  id: string,
): Promise<DocumentDetailRow | null> {
  const { data, error } = await supabase
    .from("crm_knowledge_documents")
    .select(DETAIL_SELECT)
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw new Error(`Falha ao carregar documento: ${error.message}`);
  return data as unknown as DocumentDetailRow | null;
}

/** Appends -2, -3, ... to the base slug until it's free — slugs are only
 * ever generated server-side from the title, never user-typed, so a small
 * retry loop is simpler and safer than a DB-level generated sequence. */
export async function generateUniqueSlug(supabase: SupabaseClient, title: string): Promise<string> {
  const base = slugify(title) || "documento";
  const { data, error } = await supabase
    .from("crm_knowledge_documents")
    .select("slug")
    .like("slug", `${base}%`);
  if (error) throw new Error(`Falha ao gerar identificador do documento: ${error.message}`);

  const taken = new Set(((data ?? []) as { slug: string }[]).map((r) => r.slug));
  if (!taken.has(base)) return base;
  let suffix = 2;
  while (taken.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

export interface CreateDocumentPayload {
  categoryId: string | null;
  title: string;
  slug: string;
  contentType: KnowledgeContentType;
  contentJson: KnowledgeBlock[];
  contentText: string;
  summary: string | null;
  externalUrl: string | null;
  clientId: string | null;
  projectId: string | null;
  crmLeadId: string | null;
  conversationId: string | null;
  automationId: string | null;
  integrationId: string | null;
  financialTransactionId: string | null;
  createdBy: string | null;
}

export async function createDocument(
  supabase: SupabaseClient,
  payload: CreateDocumentPayload,
): Promise<{ id: string }> {
  const { data, error } = await supabase
    .from("crm_knowledge_documents")
    .insert({
      category_id: payload.categoryId,
      title: payload.title,
      slug: payload.slug,
      content_type: payload.contentType,
      content_json: payload.contentJson,
      content_text: payload.contentText,
      summary: payload.summary,
      external_url: payload.externalUrl,
      client_id: payload.clientId,
      project_id: payload.projectId,
      crm_lead_id: payload.crmLeadId,
      conversation_id: payload.conversationId,
      automation_id: payload.automationId,
      integration_id: payload.integrationId,
      financial_transaction_id: payload.financialTransactionId,
      created_by: payload.createdBy,
      updated_by: payload.createdBy,
    })
    .select("id")
    .single();

  if (error) throw new Error(`Falha ao criar documento: ${error.message}`);
  return data as { id: string };
}

export interface UpdateDocumentPayload {
  categoryId?: string | null;
  title?: string;
  contentType?: KnowledgeContentType;
  contentJson?: KnowledgeBlock[];
  contentText?: string;
  summary?: string | null;
  externalUrl?: string | null;
  clientId?: string | null;
  projectId?: string | null;
  crmLeadId?: string | null;
  conversationId?: string | null;
  automationId?: string | null;
  integrationId?: string | null;
  financialTransactionId?: string | null;
  currentVersion?: number;
  updatedBy: string | null;
}

export async function updateDocument(
  supabase: SupabaseClient,
  id: string,
  patch: UpdateDocumentPayload,
): Promise<void> {
  const payload: Record<string, unknown> = { updated_by: patch.updatedBy };
  if (patch.categoryId !== undefined) payload.category_id = patch.categoryId;
  if (patch.title !== undefined) payload.title = patch.title;
  if (patch.contentType !== undefined) payload.content_type = patch.contentType;
  if (patch.contentJson !== undefined) payload.content_json = patch.contentJson;
  if (patch.contentText !== undefined) payload.content_text = patch.contentText;
  if (patch.summary !== undefined) payload.summary = patch.summary;
  if (patch.externalUrl !== undefined) payload.external_url = patch.externalUrl;
  if (patch.clientId !== undefined) payload.client_id = patch.clientId;
  if (patch.projectId !== undefined) payload.project_id = patch.projectId;
  if (patch.crmLeadId !== undefined) payload.crm_lead_id = patch.crmLeadId;
  if (patch.conversationId !== undefined) payload.conversation_id = patch.conversationId;
  if (patch.automationId !== undefined) payload.automation_id = patch.automationId;
  if (patch.integrationId !== undefined) payload.integration_id = patch.integrationId;
  if (patch.financialTransactionId !== undefined)
    payload.financial_transaction_id = patch.financialTransactionId;
  if (patch.currentVersion !== undefined) payload.current_version = patch.currentVersion;

  const { error } = await supabase.from("crm_knowledge_documents").update(payload).eq("id", id);
  if (error) throw new Error(`Falha ao atualizar documento: ${error.message}`);
}

export async function updateDocumentStatus(
  supabase: SupabaseClient,
  id: string,
  status: KnowledgeDocumentStatus,
  actorId: string | null,
): Promise<void> {
  const payload: Record<string, unknown> = { status, updated_by: actorId };
  if (status === "publicado") {
    payload.published_at = new Date().toISOString();
    payload.published_by = actorId;
  }

  const { error } = await supabase.from("crm_knowledge_documents").update(payload).eq("id", id);
  if (error) throw new Error(`Falha ao atualizar status do documento: ${error.message}`);
}

export async function softDeleteDocument(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase
    .from("crm_knowledge_documents")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(`Falha ao excluir documento: ${error.message}`);
}
