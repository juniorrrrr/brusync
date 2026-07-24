"use server";

import { revalidatePath } from "next/cache";
import { requireCrmProfile } from "@/application/crm/authGuard";
import { KNOWLEDGE_STATUS_TRANSITIONS } from "@/domain/knowledge/types";
import {
  getDemoKnowledgeDocumentDetail,
  getDemoKnowledgeDocuments,
} from "@/lib/demo/mockKnowledge";
import type { ListDocumentsOptions } from "@/repositories/knowledge/documentsRepository";
import * as viewsRepo from "@/repositories/knowledge/viewsRepository";
import { isDemoModeActive } from "@/services/demo/demoMode";
import * as documentService from "@/services/knowledge/knowledgeDocumentService";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type {
  KnowledgeDocumentDetail,
  KnowledgeDocumentStatus,
  KnowledgeDocumentSummary,
} from "@/types/knowledge";

const DEMO_WRITE_BLOCKED_MESSAGE =
  "Ação indisponível em Modo Demonstração — nenhuma escrita é enviada ao banco.";

export async function fetchKnowledgeDocuments(
  options: ListDocumentsOptions = {},
): Promise<{ documents: KnowledgeDocumentSummary[]; total: number }> {
  const profile = await requireCrmProfile();
  if (await isDemoModeActive()) return getDemoKnowledgeDocuments(options);

  const supabase = await getSupabaseAuthClient();
  return documentService.listDocumentSummaries(supabase, { ...options, actorId: profile.id });
}

export async function fetchKnowledgeDocumentDetail(
  id: string,
): Promise<KnowledgeDocumentDetail | null> {
  const profile = await requireCrmProfile();
  if (await isDemoModeActive()) return getDemoKnowledgeDocumentDetail(id);

  const supabase = await getSupabaseAuthClient();
  return documentService.getDocumentDetail(supabase, id, profile.id);
}

export async function recordKnowledgeDocumentViewAction(documentId: string): Promise<void> {
  const profile = await requireCrmProfile();
  if (await isDemoModeActive()) return;

  const supabase = await getSupabaseAuthClient();
  await viewsRepo.recordView(supabase, { documentId, userId: profile.id, action: "view" });
}

export interface DocumentActionState {
  status: "idle" | "success" | "error";
  message?: string;
  documentId?: string;
}

export async function createKnowledgeDocumentAction(
  input: documentService.KnowledgeDocumentInput,
): Promise<DocumentActionState> {
  const profile = await requireCrmProfile();
  if (await isDemoModeActive()) return { status: "error", message: DEMO_WRITE_BLOCKED_MESSAGE };
  if (!input.title.trim()) return { status: "error", message: "Informe um título." };

  const supabase = await getSupabaseAuthClient();
  const { id } = await documentService.createDocument(supabase, input, profile.id);

  revalidatePath("/base-conhecimento");
  return { status: "success", message: "Documento criado.", documentId: id };
}

export async function updateKnowledgeDocumentAction(
  id: string,
  input: documentService.KnowledgeDocumentInput,
  changeNote: string | null,
): Promise<DocumentActionState> {
  const profile = await requireCrmProfile();
  if (await isDemoModeActive()) return { status: "error", message: DEMO_WRITE_BLOCKED_MESSAGE };
  if (!input.title.trim()) return { status: "error", message: "Informe um título." };

  const supabase = await getSupabaseAuthClient();
  await documentService.updateDocument(supabase, id, input, profile.id, changeNote);

  revalidatePath("/base-conhecimento");
  revalidatePath(`/base-conhecimento/documentos/${id}`);
  return { status: "success", message: "Documento atualizado.", documentId: id };
}

export async function updateKnowledgeDocumentStatusAction(
  id: string,
  status: KnowledgeDocumentStatus,
  currentStatus: KnowledgeDocumentStatus,
): Promise<{ ok: boolean; error?: string }> {
  const profile = await requireCrmProfile();
  if (await isDemoModeActive()) return { ok: false, error: DEMO_WRITE_BLOCKED_MESSAGE };

  const allowed = KNOWLEDGE_STATUS_TRANSITIONS[currentStatus] ?? [];
  if (!allowed.includes(status)) return { ok: false, error: "Transição de status inválida." };

  const supabase = await getSupabaseAuthClient();
  await documentService.updateDocumentStatus(supabase, id, status, profile.id);

  revalidatePath("/base-conhecimento");
  revalidatePath(`/base-conhecimento/documentos/${id}`);
  return { ok: true };
}

export async function duplicateKnowledgeDocumentAction(
  id: string,
): Promise<{ ok: boolean; documentId?: string; error?: string }> {
  const profile = await requireCrmProfile();
  if (await isDemoModeActive()) return { ok: false, error: DEMO_WRITE_BLOCKED_MESSAGE };

  const supabase = await getSupabaseAuthClient();
  const { id: newId } = await documentService.duplicateDocument(supabase, id, profile.id);

  revalidatePath("/base-conhecimento");
  return { ok: true, documentId: newId };
}

export async function deleteKnowledgeDocumentAction(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  await requireCrmProfile();
  if (await isDemoModeActive()) return { ok: false, error: DEMO_WRITE_BLOCKED_MESSAGE };

  const supabase = await getSupabaseAuthClient();
  await documentService.deleteDocument(supabase, id);

  revalidatePath("/base-conhecimento");
  return { ok: true };
}
