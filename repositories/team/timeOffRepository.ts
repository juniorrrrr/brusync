import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { TeamTimeOff, TeamTimeOffStatus, TeamTimeOffType } from "@/types/team";

interface TimeOffRow {
  id: string;
  created_at: string;
  team_member_id: string;
  type: TeamTimeOffType;
  start_date: string;
  end_date: string;
  status: TeamTimeOffStatus;
  notes: string | null;
  member: { profile: { name: string | null; email: string | null } | null } | null;
}

const TIME_OFF_SELECT = `
  id, created_at, team_member_id, type, start_date, end_date, status, notes,
  member:team_members!team_time_off_team_member_id_fkey (
    profile:profiles!team_members_profile_id_fkey (name, email)
  )
`;

function mapTimeOff(row: TimeOffRow): TeamTimeOff {
  return {
    id: row.id,
    teamMemberId: row.team_member_id,
    memberName: row.member?.profile?.name ?? row.member?.profile?.email ?? null,
    type: row.type,
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

export interface ListTimeOffOptions {
  teamMemberId?: string;
  status?: TeamTimeOffStatus;
}

export async function listTimeOff(
  supabase: SupabaseClient,
  options: ListTimeOffOptions = {},
): Promise<TeamTimeOff[]> {
  let query = supabase.from("team_time_off").select(TIME_OFF_SELECT);
  if (options.teamMemberId) query = query.eq("team_member_id", options.teamMemberId);
  if (options.status) query = query.eq("status", options.status);

  const { data, error } = await query.order("start_date", { ascending: false });
  if (error) throw new Error(`Falha ao carregar ausências: ${error.message}`);
  return ((data ?? []) as unknown as TimeOffRow[]).map(mapTimeOff);
}

export interface CreateTimeOffPayload {
  teamMemberId: string;
  type: TeamTimeOffType;
  startDate: string;
  endDate: string;
  notes?: string | null;
}

export async function createTimeOff(
  supabase: SupabaseClient,
  payload: CreateTimeOffPayload,
): Promise<void> {
  const { error } = await supabase.from("team_time_off").insert({
    team_member_id: payload.teamMemberId,
    type: payload.type,
    start_date: payload.startDate,
    end_date: payload.endDate,
    notes: payload.notes ?? null,
  });
  if (error) throw new Error(`Falha ao solicitar ausência: ${error.message}`);
}

export async function updateTimeOffStatus(
  supabase: SupabaseClient,
  id: string,
  status: TeamTimeOffStatus,
): Promise<void> {
  const { error } = await supabase.from("team_time_off").update({ status }).eq("id", id);
  if (error) throw new Error(`Falha ao atualizar ausência: ${error.message}`);
}
