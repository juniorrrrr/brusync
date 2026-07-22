import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { type LeadNoteRow, mapLeadNote } from "@/repositories/crm/mappers";
import type { LeadNote } from "@/types/crm";

const NOTE_SELECT = `
  id, crm_lead_id, body, created_by, created_at, updated_at,
  author:profiles!crm_lead_notes_created_by_fkey (id, name, email)
`;

export async function listNotesForLead(
  supabase: SupabaseClient,
  crmLeadId: string,
): Promise<LeadNote[]> {
  const { data, error } = await supabase
    .from("crm_lead_notes")
    .select(NOTE_SELECT)
    .eq("crm_lead_id", crmLeadId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Falha ao carregar notas: ${error.message}`);
  return ((data ?? []) as unknown as LeadNoteRow[]).map(mapLeadNote);
}

export async function createNote(
  supabase: SupabaseClient,
  params: { crmLeadId: string; body: string; createdBy: string },
): Promise<LeadNote> {
  const { data, error } = await supabase
    .from("crm_lead_notes")
    .insert({ crm_lead_id: params.crmLeadId, body: params.body, created_by: params.createdBy })
    .select(NOTE_SELECT)
    .single();

  if (error) throw new Error(`Falha ao criar nota: ${error.message}`);
  return mapLeadNote(data as unknown as LeadNoteRow);
}

export async function updateNote(
  supabase: SupabaseClient,
  noteId: string,
  body: string,
): Promise<void> {
  const { error } = await supabase.from("crm_lead_notes").update({ body }).eq("id", noteId);
  if (error) throw new Error(`Falha ao atualizar nota: ${error.message}`);
}

export async function deleteNote(supabase: SupabaseClient, noteId: string): Promise<void> {
  const { error } = await supabase.from("crm_lead_notes").delete().eq("id", noteId);
  if (error) throw new Error(`Falha ao excluir nota: ${error.message}`);
}

export async function getNoteById(
  supabase: SupabaseClient,
  noteId: string,
): Promise<LeadNote | null> {
  const { data, error } = await supabase
    .from("crm_lead_notes")
    .select(NOTE_SELECT)
    .eq("id", noteId)
    .maybeSingle();

  if (error) throw new Error(`Falha ao carregar nota: ${error.message}`);
  if (!data) return null;
  return mapLeadNote(data as unknown as LeadNoteRow);
}
