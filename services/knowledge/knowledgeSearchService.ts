import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import * as documentsRepo from "@/repositories/knowledge/documentsRepository";
import type { KnowledgeSearchResult } from "@/types/knowledge";

type MatchedIn = KnowledgeSearchResult["matchedIn"][number];

/** Global search across title/content (search_vector), category, tags,
 * author, client, project, lead and file name — each dimension resolves to
 * a set of document ids, then results are merged and deduped with a note of
 * every dimension that matched (matchedIn), same "small parallel queries
 * merged in JS" approach used by the dashboard service. */
export async function searchKnowledge(
  supabase: SupabaseClient,
  term: string,
  limit = 30,
): Promise<KnowledgeSearchResult[]> {
  const cleaned = term.replace(/[,()%]/g, " ").trim();
  if (!cleaned) return [];
  const likeTerm = `%${cleaned}%`;

  const [
    { rows: contentRows },
    categoryMatches,
    tagMatches,
    authorMatches,
    clientMatches,
    projectMatches,
    leadMatches,
    fileMatches,
  ] = await Promise.all([
    documentsRepo.listDocuments(supabase, { search: cleaned, limit: 100 }),
    supabase
      .from("crm_knowledge_categories")
      .select("id")
      .ilike("name", likeTerm)
      .is("deleted_at", null),
    supabase
      .from("crm_knowledge_document_tags")
      .select("document_id, tag:crm_knowledge_tags!inner(name)")
      .ilike("tag.name", likeTerm),
    supabase.from("profiles").select("id").ilike("name", likeTerm),
    supabase.from("clients").select("id").ilike("company", likeTerm),
    supabase.from("crm_projects").select("id").ilike("name", likeTerm),
    supabase.from("crm_leads").select("id").ilike("name", likeTerm),
    supabase.from("crm_knowledge_files").select("document_id").ilike("file_name", likeTerm),
  ]);

  const matchedInByDocId = new Map<string, Set<MatchedIn>>();
  const addMatch = (docId: string | null | undefined, kind: MatchedIn) => {
    if (!docId) return;
    const set = matchedInByDocId.get(docId) ?? new Set<MatchedIn>();
    set.add(kind);
    matchedInByDocId.set(docId, set);
  };

  for (const row of contentRows) {
    addMatch(row.id, "titulo");
    addMatch(row.id, "conteudo");
  }

  const categoryIds = (categoryMatches.data ?? []).map((r: { id: string }) => r.id);
  const tagDocIds = ((tagMatches.data ?? []) as { document_id: string }[]).map(
    (r) => r.document_id,
  );
  const authorIds = (authorMatches.data ?? []).map((r: { id: string }) => r.id);
  const clientIds = (clientMatches.data ?? []).map((r: { id: string }) => r.id);
  const projectIds = (projectMatches.data ?? []).map((r: { id: string }) => r.id);
  const leadIds = (leadMatches.data ?? []).map((r: { id: string }) => r.id);
  const fileDocIds = ((fileMatches.data ?? []) as { document_id: string | null }[])
    .map((r) => r.document_id)
    .filter((v): v is string => !!v);

  for (const id of tagDocIds) addMatch(id, "tag");
  for (const id of fileDocIds) addMatch(id, "arquivo");

  const foundRowsById = new Map<string, documentsRepo.DocumentBaseRow>();
  for (const row of contentRows) foundRowsById.set(row.id, row);

  const idsNeedingFetch = new Set<string>([...tagDocIds, ...fileDocIds]);

  await Promise.all(
    categoryIds.map(async (categoryId: string) => {
      const { rows } = await documentsRepo.listDocuments(supabase, { categoryId, limit: 100 });
      for (const row of rows) {
        addMatch(row.id, "categoria");
        foundRowsById.set(row.id, row);
      }
    }),
  );
  await Promise.all(
    clientIds.map(async (clientId: string) => {
      const { rows } = await documentsRepo.listDocuments(supabase, { clientId, limit: 100 });
      for (const row of rows) {
        addMatch(row.id, "cliente");
        foundRowsById.set(row.id, row);
      }
    }),
  );
  await Promise.all(
    projectIds.map(async (projectId: string) => {
      const { rows } = await documentsRepo.listDocuments(supabase, { projectId, limit: 100 });
      for (const row of rows) {
        addMatch(row.id, "projeto");
        foundRowsById.set(row.id, row);
      }
    }),
  );
  await Promise.all(
    leadIds.map(async (crmLeadId: string) => {
      const { rows } = await documentsRepo.listDocuments(supabase, { crmLeadId, limit: 100 });
      for (const row of rows) {
        addMatch(row.id, "lead");
        foundRowsById.set(row.id, row);
      }
    }),
  );

  if (authorIds.length > 0) {
    const { data: authoredDocs } = await supabase
      .from("crm_knowledge_documents")
      .select("id")
      .in("created_by", authorIds)
      .is("deleted_at", null);
    for (const row of (authoredDocs ?? []) as { id: string }[]) addMatch(row.id, "autor");
  }

  if (idsNeedingFetch.size > 0) {
    const missingIds = [...idsNeedingFetch].filter((id) => !foundRowsById.has(id));
    if (missingIds.length > 0) {
      const { rows } = await documentsRepo.listDocuments(supabase, {
        documentIds: missingIds,
        limit: missingIds.length,
      });
      for (const row of rows) foundRowsById.set(row.id, row);
    }
  }

  const allMatchedIds = [...matchedInByDocId.keys()];
  const missingRowIds = allMatchedIds.filter((id) => !foundRowsById.has(id));
  if (missingRowIds.length > 0) {
    const { rows } = await documentsRepo.listDocuments(supabase, {
      documentIds: missingRowIds,
      limit: missingRowIds.length,
    });
    for (const row of rows) foundRowsById.set(row.id, row);
  }

  const results: KnowledgeSearchResult[] = allMatchedIds
    .map((id) => foundRowsById.get(id))
    .filter((row): row is documentsRepo.DocumentBaseRow => !!row)
    .map((row) => ({
      id: row.id,
      title: row.title,
      summary: row.summary,
      contentType: row.content_type,
      status: row.status,
      categoryName: row.category?.name ?? null,
      matchedIn: [...(matchedInByDocId.get(row.id) ?? [])],
      updatedAt: row.updated_at,
    }))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return results.slice(0, limit);
}
