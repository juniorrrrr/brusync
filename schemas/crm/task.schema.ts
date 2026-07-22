import { z } from "zod";

export const taskPrioritySchema = z.enum(["low", "medium", "high"]);
export const taskStatusSchema = z.enum(["pending", "in_progress", "done"]);

export const createTaskSchema = z.object({
  crmLeadId: z.string().uuid(),
  title: z.string().trim().min(1, "Informe um título"),
  description: z.string().trim().optional(),
  priority: taskPrioritySchema.optional(),
  dueAt: z.string().datetime().optional(),
  assigneeId: z.string().uuid().optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = z.object({
  taskId: z.string().uuid(),
  title: z.string().trim().min(1).optional(),
  description: z.string().trim().optional(),
  priority: taskPrioritySchema.optional(),
  dueAt: z.string().datetime().optional(),
  assigneeId: z.string().uuid().optional(),
});

export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

export const updateTaskStatusSchema = z.object({
  taskId: z.string().uuid(),
  status: taskStatusSchema,
});

export type UpdateTaskStatusInput = z.infer<typeof updateTaskStatusSchema>;

export const deleteTaskSchema = z.object({
  taskId: z.string().uuid(),
});

export type DeleteTaskInput = z.infer<typeof deleteTaskSchema>;
