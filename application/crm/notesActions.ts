"use server";

import { revalidatePath } from "next/cache";
import { requireCrmProfile } from "@/application/crm/authGuard";
import { createActivity } from "@/repositories/crm/activitiesRepository";
import { touchLeadInteraction } from "@/repositories/crm/leadsRepository";
import {
  createNote,
  deleteNote,
  getNoteById,
  listNotesForLead,
  updateNote,
} from "@/repositories/crm/notesRepository";
import { createNoteSchema, deleteNoteSchema, updateNoteSchema } from "@/schemas/crm/note.schema";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type { LeadNote } from "@/types/crm";

function firstIssueMessage(error: { issues: { message: string }[] }) {
  return error.issues[0]?.message ?? "Dados inválidos.";
}

/** Fetched lazily, the first time the Notas tab is opened. */
export async function fetchNotes(crmLeadId: string): Promise<LeadNote[]> {
  await requireCrmProfile();
  const supabase = await getSupabaseAuthClient();
  return listNotesForLead(supabase, crmLeadId);
}

export async function createNoteAction(
  crmLeadId: string,
  body: string,
): Promise<{ ok: boolean; note?: LeadNote; error?: string }> {
  const profile = await requireCrmProfile();
  const parsed = createNoteSchema.safeParse({ crmLeadId, body });
  if (!parsed.success) return { ok: false, error: firstIssueMessage(parsed.error) };

  const supabase = await getSupabaseAuthClient();
  const note = await createNote(supabase, { ...parsed.data, createdBy: profile.id });
  await createActivity(supabase, {
    crmLeadId: parsed.data.crmLeadId,
    type: "note_created",
    title: "Nota criada",
    createdBy: profile.id,
  });
  await touchLeadInteraction(supabase, parsed.data.crmLeadId);

  revalidatePath("/leads");
  return { ok: true, note };
}

export async function updateNoteAction(
  noteId: string,
  body: string,
): Promise<{ ok: boolean; error?: string }> {
  const profile = await requireCrmProfile();
  const parsed = updateNoteSchema.safeParse({ noteId, body });
  if (!parsed.success) return { ok: false, error: firstIssueMessage(parsed.error) };

  const supabase = await getSupabaseAuthClient();
  const existing = await getNoteById(supabase, parsed.data.noteId);
  if (!existing) return { ok: false, error: "Nota não encontrada." };

  await updateNote(supabase, parsed.data.noteId, parsed.data.body);
  await createActivity(supabase, {
    crmLeadId: existing.crmLeadId,
    type: "note_updated",
    title: "Nota editada",
    createdBy: profile.id,
  });

  return { ok: true };
}

export async function deleteNoteAction(noteId: string): Promise<{ ok: boolean; error?: string }> {
  const profile = await requireCrmProfile();
  const parsed = deleteNoteSchema.safeParse({ noteId });
  if (!parsed.success) return { ok: false, error: firstIssueMessage(parsed.error) };

  const supabase = await getSupabaseAuthClient();
  const existing = await getNoteById(supabase, parsed.data.noteId);
  if (!existing) return { ok: false, error: "Nota não encontrada." };

  await deleteNote(supabase, parsed.data.noteId);
  await createActivity(supabase, {
    crmLeadId: existing.crmLeadId,
    type: "note_deleted",
    title: "Nota excluída",
    createdBy: profile.id,
  });

  return { ok: true };
}
