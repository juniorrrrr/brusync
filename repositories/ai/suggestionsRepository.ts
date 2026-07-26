import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AiContextType,
  AiSuggestion,
  AiSuggestionSeverity,
  AiSuggestionType,
} from "@/types/ai";

interface SuggestionRow {
  id: string;
  created_at: string;
  type: AiSuggestionType;
  module: AiContextType;
  context_ref: string | null;
  title: string;
  content: string;
  severity: AiSuggestionSeverity;
  is_favorite: boolean;
}

const SUGGESTION_SELECT =
  "id, created_at, type, module, context_ref, title, content, severity, is_favorite";

function mapSuggestion(row: SuggestionRow): AiSuggestion {
  return {
    id: row.id,
    type: row.type,
    module: row.module,
    contextRef: row.context_ref,
    title: row.title,
    content: row.content,
    severity: row.severity,
    evidence: [],
    isFavorite: row.is_favorite,
    createdAt: row.created_at,
  };
}

export interface ListSuggestionsOptions {
  module?: AiContextType;
  limit?: number;
  favoritesOnly?: boolean;
}

export async function listSuggestions(
  supabase: SupabaseClient,
  options: ListSuggestionsOptions = {},
): Promise<AiSuggestion[]> {
  let query = supabase.from("ai_suggestions").select(SUGGESTION_SELECT);
  if (options.module) query = query.eq("module", options.module);
  if (options.favoritesOnly) query = query.eq("is_favorite", true);

  query = query.order("created_at", { ascending: false });
  if (options.limit) query = query.limit(options.limit);

  const { data, error } = await query;
  if (error) throw new Error(`Falha ao carregar sugestões: ${error.message}`);
  return ((data ?? []) as SuggestionRow[]).map(mapSuggestion);
}

export interface LogSuggestionPayload {
  type: AiSuggestionType;
  module: AiContextType;
  contextRef: string | null;
  title: string;
  content: string;
  severity: AiSuggestionSeverity;
}

/** Grava o log de UMA sugestão já computada ao vivo (domain/ai/insights/*) —
 * nunca a fonte da verdade, só histórico para "Sugestões geradas" no
 * dashboard, mesmo princípio de team_goal_progress (Fase 25). */
export async function logSuggestion(
  supabase: SupabaseClient,
  payload: LogSuggestionPayload,
): Promise<void> {
  const { error } = await supabase.from("ai_suggestions").insert({
    type: payload.type,
    module: payload.module,
    context_ref: payload.contextRef,
    title: payload.title,
    content: payload.content,
    severity: payload.severity,
  });
  if (error) throw new Error(`Falha ao registrar sugestão: ${error.message}`);
}

export async function setSuggestionFavorite(
  supabase: SupabaseClient,
  id: string,
  favorite: boolean,
): Promise<void> {
  const { error } = await supabase
    .from("ai_suggestions")
    .update({ is_favorite: favorite })
    .eq("id", id);
  if (error) throw new Error(`Falha ao favoritar sugestão: ${error.message}`);
}

export async function countSuggestions(supabase: SupabaseClient): Promise<number> {
  const { count, error } = await supabase
    .from("ai_suggestions")
    .select("*", { count: "exact", head: true });
  if (error) throw new Error(`Falha ao contar sugestões: ${error.message}`);
  return count ?? 0;
}
