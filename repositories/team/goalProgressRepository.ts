import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { TeamGoalProgressPoint } from "@/types/team";

interface ProgressRow {
  id: string;
  goal_id: string;
  recorded_at: string;
  actual_value: number | null;
  percent_complete: number | null;
  note: string | null;
}

const PROGRESS_SELECT = "id, goal_id, recorded_at, actual_value, percent_complete, note";

function mapProgress(row: ProgressRow): TeamGoalProgressPoint {
  return {
    id: row.id,
    goalId: row.goal_id,
    recordedAt: row.recorded_at,
    actualValue: row.actual_value !== null ? Number(row.actual_value) : null,
    percentComplete: row.percent_complete !== null ? Number(row.percent_complete) : null,
    note: row.note,
  };
}

export async function listGoalProgress(
  supabase: SupabaseClient,
  goalId: string,
): Promise<TeamGoalProgressPoint[]> {
  const { data, error } = await supabase
    .from("team_goal_progress")
    .select(PROGRESS_SELECT)
    .eq("goal_id", goalId)
    .order("recorded_at", { ascending: true });

  if (error) throw new Error(`Falha ao carregar histórico da meta: ${error.message}`);
  return ((data ?? []) as ProgressRow[]).map(mapProgress);
}

export interface RecordGoalProgressPayload {
  goalId: string;
  actualValue: number | null;
  percentComplete: number | null;
  note?: string | null;
  createdBy?: string | null;
}

/** Snapshot leve, gravado a cada recálculo (dashboard/individual) — nunca
 * fonte da verdade, só histórico para o sparkline (mesmo espírito do
 * ScorecardHistoryPoint da Fase 23, que não persiste nada). */
export async function recordGoalProgress(
  supabase: SupabaseClient,
  payload: RecordGoalProgressPayload,
): Promise<void> {
  const { error } = await supabase.from("team_goal_progress").insert({
    goal_id: payload.goalId,
    actual_value: payload.actualValue,
    percent_complete: payload.percentComplete,
    note: payload.note ?? null,
    created_by: payload.createdBy ?? null,
  });
  if (error) throw new Error(`Falha ao registrar progresso: ${error.message}`);
}
