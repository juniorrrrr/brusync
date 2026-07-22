import { z } from "zod";

export const createNoteSchema = z.object({
  crmLeadId: z.string().uuid(),
  body: z.string().trim().min(1, "A nota não pode ficar vazia"),
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;

export const updateNoteSchema = z.object({
  noteId: z.string().uuid(),
  body: z.string().trim().min(1, "A nota não pode ficar vazia"),
});

export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;

export const deleteNoteSchema = z.object({
  noteId: z.string().uuid(),
});

export type DeleteNoteInput = z.infer<typeof deleteNoteSchema>;
