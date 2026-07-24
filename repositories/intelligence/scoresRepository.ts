import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { IntelligenceScoreCategory, IntelligenceScoreFactor } from "@/types/intelligence";

export interface UpsertScorePayload {
  scoreDate: string;
  category: IntelligenceScoreCategory;
  score: number;
  explanation: string;
  factors: IntelligenceScoreFactor[];
}

export async function upsertScore(
  supabase: SupabaseClient,
  payload: UpsertScorePayload,
): Promise<void> {
  const { error } = await supabase.from("intelligence_scores").upsert(
    {
      score_date: payload.scoreDate,
      category: payload.category,
      score: payload.score,
      explanation: payload.explanation,
      factors: payload.factors,
    },
    { onConflict: "score_date,category" },
  );
  if (error) throw new Error(`Falha ao salvar score: ${error.message}`);
}

export async function listScoreHistory(
  supabase: SupabaseClient,
  category: IntelligenceScoreCategory,
  sinceDate: string,
  limit = 30,
): Promise<{ date: string; score: number }[]> {
  const { data, error } = await supabase
    .from("intelligence_scores")
    .select("score_date, score")
    .eq("category", category)
    .gte("score_date", sinceDate)
    .order("score_date", { ascending: true })
    .limit(limit);

  if (error) throw new Error(`Falha ao carregar histórico de score: ${error.message}`);
  return ((data ?? []) as { score_date: string; score: number }[]).map((r) => ({
    date: r.score_date,
    score: Number(r.score),
  }));
}

export async function listAllScoreHistory(
  supabase: SupabaseClient,
  sinceDate: string,
): Promise<Record<string, { date: string; score: number }[]>> {
  const { data, error } = await supabase
    .from("intelligence_scores")
    .select("score_date, score, category")
    .gte("score_date", sinceDate)
    .order("score_date", { ascending: true });

  if (error) throw new Error(`Falha ao carregar histórico de scores: ${error.message}`);

  const grouped: Record<string, { date: string; score: number }[]> = {};
  for (const row of (data ?? []) as { score_date: string; score: number; category: string }[]) {
    const list = grouped[row.category] ?? [];
    list.push({ date: row.score_date, score: Number(row.score) });
    grouped[row.category] = list;
  }
  return grouped;
}
