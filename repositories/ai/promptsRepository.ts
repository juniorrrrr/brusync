import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AiPrompt } from "@/types/ai";

interface PromptRow {
  id: string;
  created_at: string;
  title: string;
  content: string;
  category: string | null;
  created_by: string | null;
}

const PROMPT_SELECT = "id, created_at, title, content, category, created_by";

function mapPrompt(row: PromptRow): AiPrompt {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    category: row.category,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

export async function listPrompts(supabase: SupabaseClient): Promise<AiPrompt[]> {
  const { data, error } = await supabase
    .from("ai_prompts")
    .select(PROMPT_SELECT)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Falha ao carregar prompts salvos: ${error.message}`);
  return ((data ?? []) as PromptRow[]).map(mapPrompt);
}

export interface CreatePromptPayload {
  title: string;
  content: string;
  category: string | null;
  createdBy: string | null;
}

export async function createPrompt(
  supabase: SupabaseClient,
  payload: CreatePromptPayload,
): Promise<AiPrompt> {
  const { data, error } = await supabase
    .from("ai_prompts")
    .insert({
      title: payload.title,
      content: payload.content,
      category: payload.category,
      created_by: payload.createdBy,
    })
    .select(PROMPT_SELECT)
    .single();

  if (error) throw new Error(`Falha ao salvar prompt: ${error.message}`);
  return mapPrompt(data as PromptRow);
}

export async function deletePrompt(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("ai_prompts").delete().eq("id", id);
  if (error) throw new Error(`Falha ao remover prompt: ${error.message}`);
}
