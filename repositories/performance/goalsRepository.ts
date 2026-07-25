import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  GoalDirection,
  GoalPeriodType,
  GoalScopeType,
  GoalStatus,
  GoalType,
  PerformanceGoal,
} from "@/types/performance";

interface GoalRow {
  id: string;
  created_at: string;
  updated_at: string;
  type: GoalType;
  scope_type: GoalScopeType;
  scope_ref: string | null;
  period_type: GoalPeriodType;
  period_start: string;
  period_end: string;
  target_value: number;
  direction: GoalDirection;
  status: GoalStatus;
  notes: string | null;
  created_by: string | null;
}

const GOAL_SELECT =
  "id, created_at, updated_at, type, scope_type, scope_ref, period_type, period_start, period_end, target_value, direction, status, notes, created_by";

function mapGoal(row: GoalRow): PerformanceGoal {
  return {
    id: row.id,
    type: row.type,
    scopeType: row.scope_type,
    scopeRef: row.scope_ref,
    periodType: row.period_type,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    targetValue: Number(row.target_value),
    direction: row.direction,
    status: row.status,
    notes: row.notes,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface ListGoalsOptions {
  status?: GoalStatus;
  type?: GoalType;
  scopeType?: GoalScopeType;
}

export async function listGoals(
  supabase: SupabaseClient,
  options: ListGoalsOptions = {},
): Promise<PerformanceGoal[]> {
  let query = supabase.from("performance_goals").select(GOAL_SELECT);
  if (options.status) query = query.eq("status", options.status);
  if (options.type) query = query.eq("type", options.type);
  if (options.scopeType) query = query.eq("scope_type", options.scopeType);

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw new Error(`Falha ao carregar metas: ${error.message}`);
  return ((data ?? []) as GoalRow[]).map(mapGoal);
}

export interface CreateGoalPayload {
  type: GoalType;
  scopeType: GoalScopeType;
  scopeRef: string | null;
  periodType: GoalPeriodType;
  periodStart: string;
  periodEnd: string;
  targetValue: number;
  direction: GoalDirection;
  notes: string | null;
  createdBy: string | null;
}

export async function createGoal(
  supabase: SupabaseClient,
  payload: CreateGoalPayload,
): Promise<PerformanceGoal> {
  const { data, error } = await supabase
    .from("performance_goals")
    .insert({
      type: payload.type,
      scope_type: payload.scopeType,
      scope_ref: payload.scopeRef,
      period_type: payload.periodType,
      period_start: payload.periodStart,
      period_end: payload.periodEnd,
      target_value: payload.targetValue,
      direction: payload.direction,
      notes: payload.notes,
      created_by: payload.createdBy,
    })
    .select(GOAL_SELECT)
    .single();

  if (error) throw new Error(`Falha ao criar meta: ${error.message}`);
  return mapGoal(data as GoalRow);
}

export interface UpdateGoalPayload {
  targetValue?: number;
  periodStart?: string;
  periodEnd?: string;
  notes?: string | null;
}

export async function updateGoal(
  supabase: SupabaseClient,
  id: string,
  patch: UpdateGoalPayload,
): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (patch.targetValue !== undefined) payload.target_value = patch.targetValue;
  if (patch.periodStart !== undefined) payload.period_start = patch.periodStart;
  if (patch.periodEnd !== undefined) payload.period_end = patch.periodEnd;
  if (patch.notes !== undefined) payload.notes = patch.notes;

  const { error } = await supabase.from("performance_goals").update(payload).eq("id", id);
  if (error) throw new Error(`Falha ao atualizar meta: ${error.message}`);
}

export async function archiveGoal(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase
    .from("performance_goals")
    .update({ status: "arquivada" })
    .eq("id", id);
  if (error) throw new Error(`Falha ao arquivar meta: ${error.message}`);
}

export async function reactivateGoal(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase
    .from("performance_goals")
    .update({ status: "ativa" })
    .eq("id", id);
  if (error) throw new Error(`Falha ao reativar meta: ${error.message}`);
}
