import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { extractPlainText } from "@/domain/knowledge/blocks";
import * as documentsRepo from "@/repositories/knowledge/documentsRepository";
import * as favoritesRepo from "@/repositories/knowledge/favoritesRepository";
import * as filesRepo from "@/repositories/knowledge/filesRepository";
import * as tagsRepo from "@/repositories/knowledge/tagsRepository";
import * as versionsRepo from "@/repositories/knowledge/versionsRepository";
import * as viewsRepo from "@/repositories/knowledge/viewsRepository";
import type {
  KnowledgeBlock,
  KnowledgeContentType,
  KnowledgeDocumentDetail,
  KnowledgeDocumentStatus,
  KnowledgeDocumentSummary,
} from "@/types/knowledge";

function toSummary(
  row: documentsRepo.DocumentBaseRow,
  tags: { id: string; name: string; slug: string }[],
  viewCount: number,
  favorite: boolean | undefined,
): KnowledgeDocumentSummary {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    contentType: row.content_type,
    status: row.status,
    summary: row.summary,
    categoryId: row.category_id,
    categoryName: row.category?.name ?? null,
    categoryColor: row.category?.color ?? null,
    categoryIcon: row.category?.icon ?? null,
    tags,
    viewCount,
    isFavorite: favorite !== undefined,
    isPinned: favorite === true,
    createdBy: row.created_by,
    createdByName: row.creator?.name ?? row.creator?.email ?? null,
    updatedAt: row.updated_at,
    createdAt: row.created_at,
    publishedAt: row.published_at,
  };
}

export interface ListDocumentsForServiceOptions extends documentsRepo.ListDocumentsOptions {
  actorId: string;
}

export async function listDocumentSummaries(
  supabase: SupabaseClient,
  options: ListDocumentsForServiceOptions,
): Promise<{ documents: KnowledgeDocumentSummary[]; total: number }> {
  const { actorId, ...listOptions } = options;
  const { rows, total } = await documentsRepo.listDocuments(supabase, listOptions);
  const ids = rows.map((r) => r.id);

  const [tagsByDoc, viewCounts, favoriteFlags] = await Promise.all([
    tagsRepo.listTagsForDocuments(supabase, ids),
    viewsRepo.countViewsForDocuments(supabase, ids),
    favoritesRepo.listFavoriteFlags(supabase, actorId, ids),
  ]);

  const documents = rows.map((row) =>
    toSummary(
      row,
      tagsByDoc.get(row.id) ?? [],
      viewCounts.get(row.id) ?? 0,
      favoriteFlags.get(row.id),
    ),
  );

  return { documents, total };
}

export async function getDocumentDetail(
  supabase: SupabaseClient,
  id: string,
  actorId: string,
): Promise<KnowledgeDocumentDetail | null> {
  const row = await documentsRepo.getDocumentById(supabase, id);
  if (!row) return null;

  const [tagsByDoc, viewCounts, favoriteFlags, files] = await Promise.all([
    tagsRepo.listTagsForDocuments(supabase, [id]),
    viewsRepo.countViewsForDocuments(supabase, [id]),
    favoritesRepo.listFavoriteFlags(supabase, actorId, [id]),
    filesRepo.listFilesForDocument(supabase, id),
  ]);

  const summary = toSummary(
    row,
    tagsByDoc.get(id) ?? [],
    viewCounts.get(id) ?? 0,
    favoriteFlags.get(id),
  );

  return {
    ...summary,
    contentJson: row.content_json,
    externalUrl: row.external_url,
    currentVersion: row.current_version,
    updatedByName: row.updater?.name ?? row.updater?.email ?? null,
    publishedByName: row.publisher?.name ?? row.publisher?.email ?? null,
    files,
    clientId: row.client_id,
    clientCompany: row.client?.company ?? null,
    projectId: row.project_id,
    projectName: row.project?.name ?? null,
    crmLeadId: row.crm_lead_id,
    crmLeadName: row.crm_lead?.name ?? null,
    conversationId: row.conversation_id,
    automationId: row.automation_id,
    automationName: row.automation?.name ?? null,
    integrationId: row.integration_id,
    integrationName: row.integration?.name ?? null,
    financialTransactionId: row.financial_transaction_id,
    financialTransactionDescription: row.financial_transaction?.description ?? null,
  };
}

export interface KnowledgeDocumentInput {
  categoryId: string | null;
  title: string;
  contentType: KnowledgeContentType;
  contentJson: KnowledgeBlock[];
  summary: string | null;
  externalUrl: string | null;
  tagNames: string[];
  clientId: string | null;
  projectId: string | null;
  crmLeadId: string | null;
  conversationId: string | null;
  automationId: string | null;
  integrationId: string | null;
  financialTransactionId: string | null;
}

export async function createDocument(
  supabase: SupabaseClient,
  input: KnowledgeDocumentInput,
  actorId: string,
): Promise<{ id: string }> {
  const slug = await documentsRepo.generateUniqueSlug(supabase, input.title);
  const contentText = extractPlainText(input.contentJson);

  const { id } = await documentsRepo.createDocument(supabase, {
    categoryId: input.categoryId,
    title: input.title,
    slug,
    contentType: input.contentType,
    contentJson: input.contentJson,
    contentText,
    summary: input.summary,
    externalUrl: input.externalUrl,
    clientId: input.clientId,
    projectId: input.projectId,
    crmLeadId: input.crmLeadId,
    conversationId: input.conversationId,
    automationId: input.automationId,
    integrationId: input.integrationId,
    financialTransactionId: input.financialTransactionId,
    createdBy: actorId,
  });

  const tags = await tagsRepo.findOrCreateTags(supabase, input.tagNames, actorId);
  await tagsRepo.setDocumentTags(
    supabase,
    id,
    tags.map((t) => t.id),
  );

  await versionsRepo.createVersion(supabase, {
    documentId: id,
    versionNumber: 1,
    title: input.title,
    contentJson: input.contentJson,
    summary: input.summary,
    changeNote: "Criação do documento.",
    createdBy: actorId,
  });

  return { id };
}

export async function updateDocument(
  supabase: SupabaseClient,
  id: string,
  input: KnowledgeDocumentInput,
  actorId: string,
  changeNote: string | null,
): Promise<void> {
  const current = await documentsRepo.getDocumentById(supabase, id);
  if (!current) throw new Error("Documento não encontrado.");

  // Snapshot the state as it was BEFORE this update — never overwritten.
  await versionsRepo.createVersion(supabase, {
    documentId: id,
    versionNumber: current.current_version,
    title: current.title,
    contentJson: current.content_json,
    summary: current.summary,
    changeNote: changeNote ?? "Atualização de conteúdo.",
    createdBy: actorId,
  });

  const contentText = extractPlainText(input.contentJson);

  await documentsRepo.updateDocument(supabase, id, {
    categoryId: input.categoryId,
    title: input.title,
    contentType: input.contentType,
    contentJson: input.contentJson,
    contentText,
    summary: input.summary,
    externalUrl: input.externalUrl,
    clientId: input.clientId,
    projectId: input.projectId,
    crmLeadId: input.crmLeadId,
    conversationId: input.conversationId,
    automationId: input.automationId,
    integrationId: input.integrationId,
    financialTransactionId: input.financialTransactionId,
    currentVersion: current.current_version + 1,
    updatedBy: actorId,
  });

  const tags = await tagsRepo.findOrCreateTags(supabase, input.tagNames, actorId);
  await tagsRepo.setDocumentTags(
    supabase,
    id,
    tags.map((t) => t.id),
  );
}

export async function updateDocumentStatus(
  supabase: SupabaseClient,
  id: string,
  status: KnowledgeDocumentStatus,
  actorId: string,
): Promise<void> {
  await documentsRepo.updateDocumentStatus(supabase, id, status, actorId);
}

export async function duplicateDocument(
  supabase: SupabaseClient,
  id: string,
  actorId: string,
): Promise<{ id: string }> {
  const source = await documentsRepo.getDocumentById(supabase, id);
  if (!source) throw new Error("Documento não encontrado.");

  const sourceTags = (await tagsRepo.listTagsForDocuments(supabase, [id])).get(id) ?? [];
  const title = `${source.title} (cópia)`;
  return createDocument(
    supabase,
    {
      categoryId: source.category_id,
      title,
      contentType: source.content_type,
      contentJson: source.content_json,
      summary: source.summary,
      externalUrl: source.external_url,
      tagNames: sourceTags.map((t) => t.name),
      clientId: source.client_id,
      projectId: source.project_id,
      crmLeadId: source.crm_lead_id,
      conversationId: source.conversation_id,
      automationId: source.automation_id,
      integrationId: source.integration_id,
      financialTransactionId: source.financial_transaction_id,
    },
    actorId,
  );
}

export async function deleteDocument(supabase: SupabaseClient, id: string): Promise<void> {
  await documentsRepo.softDeleteDocument(supabase, id);
}

export async function restoreVersion(
  supabase: SupabaseClient,
  documentId: string,
  versionId: string,
  actorId: string,
): Promise<void> {
  const version = await versionsRepo.getVersion(supabase, versionId);
  if (!version || version.documentId !== documentId) throw new Error("Versão não encontrada.");

  const current = await documentsRepo.getDocumentById(supabase, documentId);
  if (!current) throw new Error("Documento não encontrado.");

  const currentTags =
    (await tagsRepo.listTagsForDocuments(supabase, [documentId])).get(documentId) ?? [];

  await updateDocument(
    supabase,
    documentId,
    {
      categoryId: current.category_id,
      title: version.title,
      contentType: current.content_type,
      contentJson: version.contentJson,
      summary: version.summary,
      externalUrl: current.external_url,
      tagNames: currentTags.map((t) => t.name),
      clientId: current.client_id,
      projectId: current.project_id,
      crmLeadId: current.crm_lead_id,
      conversationId: current.conversation_id,
      automationId: current.automation_id,
      integrationId: current.integration_id,
      financialTransactionId: current.financial_transaction_id,
    },
    actorId,
    `Restaurado da versão ${version.versionNumber}.`,
  );
}
