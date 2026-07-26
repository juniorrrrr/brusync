import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { WhatsappLabel } from "@/types/whatsapp";

export async function listLabels(supabase: SupabaseClient): Promise<WhatsappLabel[]> {
  const { data, error } = await supabase
    .from("whatsapp_labels")
    .select("id, name, color")
    .order("name", { ascending: true });
  if (error) throw new Error(`Falha ao carregar etiquetas: ${error.message}`);
  return (data ?? []) as WhatsappLabel[];
}

export async function createLabel(
  supabase: SupabaseClient,
  name: string,
  color: string,
): Promise<WhatsappLabel> {
  const { data, error } = await supabase
    .from("whatsapp_labels")
    .insert({ name, color })
    .select("id, name, color")
    .single();
  if (error) throw new Error(`Falha ao criar etiqueta: ${error.message}`);
  return data as WhatsappLabel;
}

export async function deleteLabel(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("whatsapp_labels").delete().eq("id", id);
  if (error) throw new Error(`Falha ao remover etiqueta: ${error.message}`);
}
