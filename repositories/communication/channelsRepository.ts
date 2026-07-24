import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Channel, ChannelType } from "@/types/communication";

interface ChannelRow {
  id: string;
  type: ChannelType;
  name: string;
  is_active: boolean;
}

function mapChannel(row: ChannelRow): Channel {
  return { id: row.id, type: row.type, name: row.name, isActive: row.is_active };
}

export async function listChannels(supabase: SupabaseClient): Promise<Channel[]> {
  const { data, error } = await supabase
    .from("crm_channels")
    .select("id, type, name, is_active")
    .order("name", { ascending: true });

  if (error) throw new Error(`Falha ao carregar canais: ${error.message}`);
  return ((data ?? []) as unknown as ChannelRow[]).map(mapChannel);
}
