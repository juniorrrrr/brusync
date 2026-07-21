import { z } from "zod";

export const activityTypeSchema = z.enum([
  "note",
  "stage_change",
  "call",
  "email",
  "meeting",
  "task",
  "system",
]);

export const createActivitySchema = z.object({
  crmLeadId: z.string().uuid(),
  type: activityTypeSchema,
  title: z.string().trim().min(1, "Informe um título"),
  body: z.string().trim().optional(),
  dueAt: z.string().datetime().optional(),
});

export type CreateActivityInput = z.infer<typeof createActivitySchema>;

export const toggleTaskDoneSchema = z.object({
  activityId: z.string().uuid(),
  done: z.boolean(),
});

export type ToggleTaskDoneInput = z.infer<typeof toggleTaskDoneSchema>;
