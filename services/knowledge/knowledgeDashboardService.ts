import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import * as categoriesRepo from "@/repositories/knowledge/categoriesRepository";
import * as documentsRepo from "@/repositories/knowledge/documentsRepository";
import * as favoritesRepo from "@/repositories/knowledge/favoritesRepository";
import * as filesRepo from "@/repositories/knowledge/filesRepository";
import * as tagsRepo from "@/repositories/knowledge/tagsRepository";
import * as viewsRepo from "@/repositories/knowledge/viewsRepository";
import type {
  KnowledgeCategory,
  KnowledgeDashboardData,
  KnowledgeDocumentSummary,
} from "@/types/knowledge";

const STALE_THRESHOLD_DAYS = 90;
const STALE_SCAN_LIMIT = 300;

function toSummaries(
  rows: documentsRepo.DocumentBaseRow[],
  tagsByDoc: Map<string, { id: string; name: string; slug: string }[]>,
  viewCounts: Map<string, number>,
): KnowledgeDocumentSummary[] {
  return rows.map((row) => ({
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
    tags: tagsByDoc.get(row.id) ?? [],
    viewCount: viewCounts.get(row.id) ?? 0,
    isFavorite: false,
    isPinned: false,
    createdBy: row.created_by,
    createdByName: row.creator?.name ?? row.creator?.email ?? null,
    updatedAt: row.updated_at,
    createdAt: row.created_at,
    publishedAt: row.published_at,
  }));
}

function computeCategoryUsage(
  categories: KnowledgeCategory[],
  allDocs: documentsRepo.DocumentBaseRow[],
  viewCounts: Map<string, number>,
) {
  return categories
    .map((category) => {
      const docsInCategory = allDocs.filter((r) => r.category_id === category.id);
      return {
        categoryName: category.name,
        documentCount: category.documentCount,
        viewCount: docsInCategory.reduce((sum, r) => sum + (viewCounts.get(r.id) ?? 0), 0),
      };
    })
    .sort((a, b) => b.documentCount - a.documentCount);
}

export async function getKnowledgeDashboardData(
  supabase: SupabaseClient,
): Promise<KnowledgeDashboardData> {
  const [
    { rows: recentRows, total: documentsCount },
    categories,
    filesCount,
    viewsCount,
    favoritesCount,
    { total: publishedCount },
    { total: draftCount },
    topViewed,
    { rows: scanRows },
  ] = await Promise.all([
    documentsRepo.listDocuments(supabase, { limit: 6 }),
    categoriesRepo.listCategories(supabase),
    filesRepo.countAllFiles(supabase),
    viewsRepo.countTotalViews(supabase),
    favoritesRepo.countAllFavorites(supabase),
    documentsRepo.listDocuments(supabase, { status: "publicado", limit: 1 }),
    documentsRepo.listDocuments(supabase, { status: "rascunho", limit: 1 }),
    viewsRepo.rankDocumentsByViews(supabase, 6),
    documentsRepo.listDocuments(supabase, { limit: STALE_SCAN_LIMIT }),
  ]);

  const staleThreshold = new Date();
  staleThreshold.setDate(staleThreshold.getDate() - STALE_THRESHOLD_DAYS);
  const staleRows = scanRows
    .filter((r) => new Date(r.updated_at) < staleThreshold)
    .sort((a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime())
    .slice(0, 6);

  const updatedRows = [...scanRows]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 6);

  const mostAccessedIds = topViewed.map((t) => t.documentId);
  const { rows: mostAccessedRows } =
    mostAccessedIds.length > 0
      ? await documentsRepo.listDocuments(supabase, {
          documentIds: mostAccessedIds,
          limit: mostAccessedIds.length,
        })
      : { rows: [] as documentsRepo.DocumentBaseRow[] };
  const viewCountById = new Map(topViewed.map((t) => [t.documentId, t.count]));
  const mostAccessedSorted = [...mostAccessedRows].sort(
    (a, b) => (viewCountById.get(b.id) ?? 0) - (viewCountById.get(a.id) ?? 0),
  );

  const allIds = [
    ...new Set([
      ...recentRows.map((r) => r.id),
      ...scanRows.map((r) => r.id),
      ...mostAccessedSorted.map((r) => r.id),
    ]),
  ];
  const [tagsByDoc, viewCounts] = await Promise.all([
    tagsRepo.listTagsForDocuments(supabase, allIds),
    viewsRepo.countViewsForDocuments(supabase, allIds),
  ]);

  return {
    documentsCount,
    categoriesCount: categories.length,
    filesCount,
    viewsCount,
    favoritesCount,
    publishedCount,
    draftCount,
    recentDocuments: toSummaries(recentRows, tagsByDoc, viewCounts).slice(0, 5),
    recentlyUpdated: toSummaries(updatedRows, tagsByDoc, viewCounts),
    mostAccessed: toSummaries(mostAccessedSorted, tagsByDoc, viewCounts),
    staleDocuments: toSummaries(staleRows, tagsByDoc, viewCounts),
    categoryUsage: computeCategoryUsage(categories, scanRows, viewCounts),
  };
}
