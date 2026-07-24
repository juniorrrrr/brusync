import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { slugify } from "@/domain/knowledge/types";
import type { KnowledgeTag } from "@/types/knowledge";

interface TagRow {
  id: string;
  name: string;
  slug: string;
}

export async function listTags(supabase: SupabaseClient): Promise<KnowledgeTag[]> {
  const { data, error } = await supabase
    .from("crm_knowledge_tags")
    .select("id, name, slug")
    .order("name", { ascending: true });

  if (error) throw new Error(`Falha ao carregar tags: ${error.message}`);
  return (data ?? []) as TagRow[];
}

/** Every tag typed on a document goes through here — reuses the existing
 * row by slug when the name already exists (case/accents aside) instead of
 * creating duplicates, same idea as a lookup table with an upsert. */
export async function findOrCreateTags(
  supabase: SupabaseClient,
  names: string[],
  createdBy: string | null,
): Promise<KnowledgeTag[]> {
  const uniqueNames = [...new Set(names.map((n) => n.trim()).filter(Boolean))];
  if (uniqueNames.length === 0) return [];

  const slugs = uniqueNames.map(slugify);
  const { data: existing, error: existingError } = await supabase
    .from("crm_knowledge_tags")
    .select("id, name, slug")
    .in("slug", slugs);
  if (existingError) throw new Error(`Falha ao buscar tags: ${existingError.message}`);

  const existingRows = (existing ?? []) as TagRow[];
  const existingSlugSet = new Set(existingRows.map((t) => t.slug));
  const toCreate = uniqueNames.filter((name) => !existingSlugSet.has(slugify(name)));

  if (toCreate.length === 0) return existingRows;

  const { data: created, error: createError } = await supabase
    .from("crm_knowledge_tags")
    .insert(toCreate.map((name) => ({ name, slug: slugify(name), created_by: createdBy })))
    .select("id, name, slug");
  if (createError) throw new Error(`Falha ao criar tags: ${createError.message}`);

  return [...existingRows, ...((created ?? []) as TagRow[])];
}

export async function setDocumentTags(
  supabase: SupabaseClient,
  documentId: string,
  tagIds: string[],
): Promise<void> {
  const { error: deleteError } = await supabase
    .from("crm_knowledge_document_tags")
    .delete()
    .eq("document_id", documentId);
  if (deleteError) throw new Error(`Falha ao limpar tags do documento: ${deleteError.message}`);

  if (tagIds.length === 0) return;

  const { error: insertError } = await supabase
    .from("crm_knowledge_document_tags")
    .insert(tagIds.map((tagId) => ({ document_id: documentId, tag_id: tagId })));
  if (insertError) throw new Error(`Falha ao vincular tags ao documento: ${insertError.message}`);
}

export async function listTagsForDocuments(
  supabase: SupabaseClient,
  documentIds: string[],
): Promise<Map<string, KnowledgeTag[]>> {
  const map = new Map<string, KnowledgeTag[]>();
  if (documentIds.length === 0) return map;

  const { data, error } = await supabase
    .from("crm_knowledge_document_tags")
    .select("document_id, tag:crm_knowledge_tags(id, name, slug)")
    .in("document_id", documentIds);
  if (error) throw new Error(`Falha ao carregar tags dos documentos: ${error.message}`);

  for (const row of (data ?? []) as unknown as { document_id: string; tag: TagRow | null }[]) {
    if (!row.tag) continue;
    const list = map.get(row.document_id) ?? [];
    list.push(row.tag);
    map.set(row.document_id, list);
  }
  return map;
}
