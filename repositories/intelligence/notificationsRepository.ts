import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export interface NotificationRow {
  id: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  insight_id: string | null;
  alert_id: string | null;
}

export async function createBroadcastNotification(
  supabase: SupabaseClient,
  params: { title: string; message: string; insightId?: string; alertId?: string },
): Promise<void> {
  const { error } = await supabase.from("intelligence_notifications").insert({
    user_id: null,
    title: params.title,
    message: params.message,
    insight_id: params.insightId ?? null,
    alert_id: params.alertId ?? null,
  });
  if (error) throw new Error(`Falha ao criar notificação: ${error.message}`);
}

export async function listNotificationsForUser(
  supabase: SupabaseClient,
  userId: string,
  limit = 20,
): Promise<NotificationRow[]> {
  const { data, error } = await supabase
    .from("intelligence_notifications")
    .select("id, title, message, read, created_at, insight_id, alert_id")
    .or(`user_id.eq.${userId},user_id.is.null`)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Falha ao carregar notificações: ${error.message}`);
  return (data ?? []) as NotificationRow[];
}

export async function markNotificationRead(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase
    .from("intelligence_notifications")
    .update({ read: true, read_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(`Falha ao marcar notificação como lida: ${error.message}`);
}
