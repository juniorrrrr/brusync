import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { PlaybookHistoryEntry } from "@/types/playbooks";

export async function listHistoryForPlaybook(
  supabase: SupabaseClient,
  playbookId: string,
): Promise<PlaybookHistoryEntry[]> {
  const { data, error } = await supabase
    .from("crm_playbook_history")
    .select(
      "id, playbook_id, event_type, description, created_at, actor:profiles!crm_playbook_history_actor_id_fkey(name, email)",
    )
    .eq("playbook_id", playbookId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) throw new Error(`Falha ao carregar histórico do playbook: ${error.message}`);

  return (
    (data ?? []) as unknown as {
      id: string;
      playbook_id: string;
      event_type: string;
      description: string;
      created_at: string;
      actor?: { name: string | null; email: string | null } | null;
    }[]
  ).map((row) => ({
    id: row.id,
    playbookId: row.playbook_id,
    eventType: row.event_type,
    description: row.description,
    actorName: row.actor?.name ?? row.actor?.email ?? null,
    createdAt: row.created_at,
  }));
}
