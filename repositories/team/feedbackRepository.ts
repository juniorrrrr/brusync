import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { TeamFeedback, TeamFeedbackStatus, TeamFeedbackType } from "@/types/team";

interface FeedbackRow {
  id: string;
  created_at: string;
  updated_at: string;
  author_id: string | null;
  recipient_team_member_id: string;
  type: TeamFeedbackType;
  comment: string;
  status: TeamFeedbackStatus;
  author: { name: string | null; email: string | null } | null;
  recipient: { profile: { name: string | null; email: string | null } | null } | null;
}

const FEEDBACK_SELECT = `
  id, created_at, updated_at, author_id, recipient_team_member_id, type, comment, status,
  author:profiles!team_feedbacks_author_id_fkey (name, email),
  recipient:team_members!team_feedbacks_recipient_team_member_id_fkey (
    profile:profiles!team_members_profile_id_fkey (name, email)
  )
`;

function mapFeedback(row: FeedbackRow): TeamFeedback {
  return {
    id: row.id,
    authorId: row.author_id,
    authorName: row.author?.name ?? row.author?.email ?? null,
    recipientTeamMemberId: row.recipient_team_member_id,
    recipientName: row.recipient?.profile?.name ?? row.recipient?.profile?.email ?? null,
    type: row.type,
    comment: row.comment,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface ListFeedbacksOptions {
  recipientTeamMemberId?: string;
  type?: TeamFeedbackType;
  status?: TeamFeedbackStatus;
  limit?: number;
}

export async function listFeedbacks(
  supabase: SupabaseClient,
  options: ListFeedbacksOptions = {},
): Promise<TeamFeedback[]> {
  let query = supabase.from("team_feedbacks").select(FEEDBACK_SELECT);
  if (options.recipientTeamMemberId) {
    query = query.eq("recipient_team_member_id", options.recipientTeamMemberId);
  }
  if (options.type) query = query.eq("type", options.type);
  if (options.status) query = query.eq("status", options.status);

  query = query.order("created_at", { ascending: false });
  if (options.limit) query = query.limit(options.limit);

  const { data, error } = await query;
  if (error) throw new Error(`Falha ao carregar feedbacks: ${error.message}`);
  return ((data ?? []) as unknown as FeedbackRow[]).map(mapFeedback);
}

export interface CreateFeedbackPayload {
  authorId: string | null;
  recipientTeamMemberId: string;
  type: TeamFeedbackType;
  comment: string;
}

export async function createFeedback(
  supabase: SupabaseClient,
  payload: CreateFeedbackPayload,
): Promise<void> {
  const { error } = await supabase.from("team_feedbacks").insert({
    author_id: payload.authorId,
    recipient_team_member_id: payload.recipientTeamMemberId,
    type: payload.type,
    comment: payload.comment,
  });
  if (error) throw new Error(`Falha ao registrar feedback: ${error.message}`);
}

export async function updateFeedbackStatus(
  supabase: SupabaseClient,
  id: string,
  status: TeamFeedbackStatus,
): Promise<void> {
  const { error } = await supabase.from("team_feedbacks").update({ status }).eq("id", id);
  if (error) throw new Error(`Falha ao atualizar feedback: ${error.message}`);
}
