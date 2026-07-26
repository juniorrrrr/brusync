import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { TeamCheckin, TeamCheckinStatus, TeamCheckinType } from "@/types/team";

interface CheckinRow {
  id: string;
  created_at: string;
  updated_at: string;
  team_member_id: string;
  author_id: string | null;
  type: TeamCheckinType;
  scheduled_at: string;
  notes: string | null;
  status: TeamCheckinStatus;
  member: { profile: { name: string | null; email: string | null } | null } | null;
  author: { name: string | null; email: string | null } | null;
}

const CHECKIN_SELECT = `
  id, created_at, updated_at, team_member_id, author_id, type, scheduled_at, notes, status,
  member:team_members!team_checkins_team_member_id_fkey (
    profile:profiles!team_members_profile_id_fkey (name, email)
  ),
  author:profiles!team_checkins_author_id_fkey (name, email)
`;

function mapCheckin(row: CheckinRow): TeamCheckin {
  return {
    id: row.id,
    teamMemberId: row.team_member_id,
    memberName: row.member?.profile?.name ?? row.member?.profile?.email ?? null,
    authorId: row.author_id,
    authorName: row.author?.name ?? row.author?.email ?? null,
    type: row.type,
    scheduledAt: row.scheduled_at,
    notes: row.notes,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface ListCheckinsOptions {
  teamMemberId?: string;
  status?: TeamCheckinStatus;
  limit?: number;
}

export async function listCheckins(
  supabase: SupabaseClient,
  options: ListCheckinsOptions = {},
): Promise<TeamCheckin[]> {
  let query = supabase.from("team_checkins").select(CHECKIN_SELECT);
  if (options.teamMemberId) query = query.eq("team_member_id", options.teamMemberId);
  if (options.status) query = query.eq("status", options.status);

  query = query.order("scheduled_at", { ascending: false });
  if (options.limit) query = query.limit(options.limit);

  const { data, error } = await query;
  if (error) throw new Error(`Falha ao carregar check-ins: ${error.message}`);
  return ((data ?? []) as unknown as CheckinRow[]).map(mapCheckin);
}

export interface CreateCheckinPayload {
  teamMemberId: string;
  authorId: string | null;
  type: TeamCheckinType;
  scheduledAt: string;
  notes?: string | null;
}

export async function createCheckin(
  supabase: SupabaseClient,
  payload: CreateCheckinPayload,
): Promise<void> {
  const { error } = await supabase.from("team_checkins").insert({
    team_member_id: payload.teamMemberId,
    author_id: payload.authorId,
    type: payload.type,
    scheduled_at: payload.scheduledAt,
    notes: payload.notes ?? null,
  });
  if (error) throw new Error(`Falha ao agendar check-in: ${error.message}`);
}

export async function updateCheckinStatus(
  supabase: SupabaseClient,
  id: string,
  status: TeamCheckinStatus,
): Promise<void> {
  const { error } = await supabase.from("team_checkins").update({ status }).eq("id", id);
  if (error) throw new Error(`Falha ao atualizar check-in: ${error.message}`);
}
