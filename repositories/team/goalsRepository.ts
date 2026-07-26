import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  GoalDirection,
  TeamGoal,
  TeamGoalPeriodType,
  TeamGoalStatus,
  TeamGoalType,
} from "@/types/team";

interface GoalRow {
  id: string;
  created_at: string;
  updated_at: string;
  team_member_id: string;
  type: TeamGoalType;
  period_type: TeamGoalPeriodType;
  period_start: string;
  period_end: string;
  target_value: number;
  direction: GoalDirection;
  status: TeamGoalStatus;
  notes: string | null;
  created_by: string | null;
}

const GOAL_SELECT =
  "id, created_at, updated_at, team_member_id, type, period_type, period_start, period_end, target_value, direction, status, notes, created_by";

function mapGoal(row: GoalRow): TeamGoal {
  return {
    id: row.id,
    teamMemberId: row.team_member_id,
    type: row.type,
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

export interface ListTeamGoalsOptions {
  status?: TeamGoalStatus;
  teamMemberId?: string;
}

export async function listTeamGoals(
  supabase: SupabaseClient,
  options: ListTeamGoalsOptions = {},
): Promise<TeamGoal[]> {
  let query = supabase.from("team_goals").select(GOAL_SELECT);
  if (options.status) query = query.eq("status", options.status);
  if (options.teamMemberId) query = query.eq("team_member_id", options.teamMemberId);

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw new Error(`Falha ao carregar metas de equipe: ${error.message}`);
  return ((data ?? []) as GoalRow[]).map(mapGoal);
}

export interface CreateTeamGoalPayload {
  teamMemberId: string;
  type: TeamGoalType;
  periodType: TeamGoalPeriodType;
  periodStart: string;
  periodEnd: string;
  targetValue: number;
  direction: GoalDirection;
  notes: string | null;
  createdBy: string | null;
}

export async function createTeamGoal(
  supabase: SupabaseClient,
  payload: CreateTeamGoalPayload,
): Promise<TeamGoal> {
  const { data, error } = await supabase
    .from("team_goals")
    .insert({
      team_member_id: payload.teamMemberId,
      type: payload.type,
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

export interface UpdateTeamGoalPayload {
  targetValue?: number;
  periodStart?: string;
  periodEnd?: string;
  notes?: string | null;
}

export async function updateTeamGoal(
  supabase: SupabaseClient,
  id: string,
  patch: UpdateTeamGoalPayload,
): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (patch.targetValue !== undefined) payload.target_value = patch.targetValue;
  if (patch.periodStart !== undefined) payload.period_start = patch.periodStart;
  if (patch.periodEnd !== undefined) payload.period_end = patch.periodEnd;
  if (patch.notes !== undefined) payload.notes = patch.notes;

  const { error } = await supabase.from("team_goals").update(payload).eq("id", id);
  if (error) throw new Error(`Falha ao atualizar meta: ${error.message}`);
}

export async function archiveTeamGoal(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("team_goals").update({ status: "arquivada" }).eq("id", id);
  if (error) throw new Error(`Falha ao arquivar meta: ${error.message}`);
}
