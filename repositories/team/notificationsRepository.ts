import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { TeamNotification, TeamNotificationType } from "@/types/team";

interface NotificationRow {
  id: string;
  created_at: string;
  team_member_id: string | null;
  title: string;
  message: string;
  type: TeamNotificationType;
  read_at: string | null;
}

const NOTIFICATION_SELECT = "id, created_at, team_member_id, title, message, type, read_at";

function mapNotification(row: NotificationRow): TeamNotification {
  return {
    id: row.id,
    teamMemberId: row.team_member_id,
    title: row.title,
    message: row.message,
    type: row.type,
    readAt: row.read_at,
    createdAt: row.created_at,
  };
}

export async function listNotifications(
  supabase: SupabaseClient,
  teamMemberId?: string,
): Promise<TeamNotification[]> {
  let query = supabase.from("team_notifications").select(NOTIFICATION_SELECT);
  if (teamMemberId) query = query.or(`team_member_id.eq.${teamMemberId},team_member_id.is.null`);

  const { data, error } = await query.order("created_at", { ascending: false }).limit(50);
  if (error) throw new Error(`Falha ao carregar notificações: ${error.message}`);
  return ((data ?? []) as NotificationRow[]).map(mapNotification);
}

export async function markNotificationRead(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase
    .from("team_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(`Falha ao marcar notificação como lida: ${error.message}`);
}
