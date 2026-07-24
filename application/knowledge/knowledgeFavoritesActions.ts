"use server";

import { revalidatePath } from "next/cache";
import { requireCrmProfile } from "@/application/crm/authGuard";
import {
  getDemoKnowledgeFavoriteDocuments,
  getDemoKnowledgeMostAccessedDocuments,
  getDemoKnowledgeRecentDocuments,
} from "@/lib/demo/mockKnowledge";
import * as documentsRepo from "@/repositories/knowledge/documentsRepository";
import * as favoritesRepo from "@/repositories/knowledge/favoritesRepository";
import * as viewsRepo from "@/repositories/knowledge/viewsRepository";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { listDocumentSummaries } from "@/services/knowledge/knowledgeDocumentService";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type { KnowledgeDocumentSummary } from "@/types/knowledge";

const DEMO_WRITE_BLOCKED_MESSAGE =
  "Ação indisponível em Modo Demonstração — nenhuma escrita é enviada ao banco.";

export async function toggleKnowledgeFavoriteAction(
  documentId: string,
): Promise<{ ok: boolean; favorite?: boolean; error?: string }> {
  const profile = await requireCrmProfile();
  if (await isDemoModeActive()) return { ok: false, error: DEMO_WRITE_BLOCKED_MESSAGE };

  const supabase = await getSupabaseAuthClient();
  const favorite = await favoritesRepo.toggleFavorite(supabase, documentId, profile.id);

  revalidatePath("/base-conhecimento/favoritos");
  return { ok: true, favorite };
}

export async function setKnowledgeDocumentPinnedAction(
  documentId: string,
  pinned: boolean,
): Promise<{ ok: boolean; error?: string }> {
  const profile = await requireCrmProfile();
  if (await isDemoModeActive()) return { ok: false, error: DEMO_WRITE_BLOCKED_MESSAGE };

  const supabase = await getSupabaseAuthClient();
  await favoritesRepo.setPinned(supabase, documentId, profile.id, pinned);

  revalidatePath("/base-conhecimento/favoritos");
  return { ok: true };
}

export async function fetchKnowledgeFavoriteDocuments(): Promise<KnowledgeDocumentSummary[]> {
  const profile = await requireCrmProfile();
  if (await isDemoModeActive()) return getDemoKnowledgeFavoriteDocuments();

  const supabase = await getSupabaseAuthClient();
  const ids = await favoritesRepo.listFavoriteDocumentIds(supabase, profile.id);
  if (ids.length === 0) return [];

  const { documents } = await listDocumentSummaries(supabase, {
    documentIds: ids,
    limit: ids.length,
    actorId: profile.id,
  });
  return documents;
}

export async function fetchKnowledgeRecentDocuments(
  limit = 10,
): Promise<KnowledgeDocumentSummary[]> {
  const profile = await requireCrmProfile();
  if (await isDemoModeActive()) return getDemoKnowledgeRecentDocuments(limit);

  const supabase = await getSupabaseAuthClient();
  const { documents } = await listDocumentSummaries(supabase, { limit, actorId: profile.id });
  return documents;
}

export async function fetchKnowledgeMostAccessedDocuments(
  limit = 10,
): Promise<KnowledgeDocumentSummary[]> {
  const profile = await requireCrmProfile();
  if (await isDemoModeActive()) return getDemoKnowledgeMostAccessedDocuments(limit);

  const supabase = await getSupabaseAuthClient();
  const ranked = await viewsRepo.rankDocumentsByViews(supabase, limit);
  const ids = ranked.map((r) => r.documentId);
  if (ids.length === 0) return [];

  const { documents } = await listDocumentSummaries(supabase, {
    documentIds: ids,
    limit: ids.length,
    actorId: profile.id,
  });
  const order = new Map(ranked.map((r, index) => [r.documentId, index]));
  return documents.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
}

export async function fetchKnowledgeNeverAccessedDocuments(): Promise<KnowledgeDocumentSummary[]> {
  const profile = await requireCrmProfile();
  if (await isDemoModeActive()) return [];

  const supabase = await getSupabaseAuthClient();
  const { rows } = await documentsRepo.listDocuments(supabase, { limit: 200 });
  const viewCounts = await viewsRepo.countViewsForDocuments(
    supabase,
    rows.map((r) => r.id),
  );
  const neverViewedIds = rows.filter((r) => !viewCounts.get(r.id)).map((r) => r.id);
  if (neverViewedIds.length === 0) return [];

  const { documents } = await listDocumentSummaries(supabase, {
    documentIds: neverViewedIds,
    limit: neverViewedIds.length,
    actorId: profile.id,
  });
  return documents;
}
