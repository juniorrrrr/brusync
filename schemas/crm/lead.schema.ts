import { z } from "zod";

export const createLeadSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome"),
  company: z.string().trim().optional(),
  jobTitle: z.string().trim().optional(),
  city: z.string().trim().optional(),
  email: z.string().trim().email("E-mail inválido").optional().or(z.literal("")),
  phone: z.string().trim().optional(),
  origin: z.string().trim().optional(),
  stageId: z.string().uuid().optional(),
  ownerId: z.string().uuid().optional().or(z.literal("")),
  potentialValue: z.coerce.number().nonnegative().optional(),
  tags: z.array(z.string().trim().min(1)).optional(),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;

export const updateLeadSchema = z.object({
  leadId: z.string().uuid(),
  name: z.string().trim().min(1).optional(),
  company: z.string().trim().optional(),
  jobTitle: z.string().trim().optional(),
  city: z.string().trim().optional(),
  email: z.string().trim().email("E-mail inválido").optional().or(z.literal("")),
  phone: z.string().trim().optional(),
  origin: z.string().trim().optional(),
  ownerId: z.string().uuid().optional().or(z.literal("")),
  potentialValue: z.coerce.number().nonnegative().optional(),
  tags: z.array(z.string().trim().min(1)).optional(),
});

export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;

/** Score is intentionally not part of this schema — it's a system-computed
 * field (application/crm/scoreService.ts), never user-editable. */

export const moveLeadStageSchema = z.object({
  leadId: z.string().uuid(),
  stageId: z.string().uuid(),
});

export type MoveLeadStageInput = z.infer<typeof moveLeadStageSchema>;

export const bulkUpdateLeadsSchema = z.object({
  leadIds: z.array(z.string().uuid()).min(1),
  stageId: z.string().uuid().optional(),
  ownerId: z.string().uuid().optional(),
});

export type BulkUpdateLeadsInput = z.infer<typeof bulkUpdateLeadsSchema>;

export const lostReasonSchema = z.enum([
  "preco",
  "sem_interesse",
  "concorrente",
  "sem_orcamento",
  "nao_respondeu",
  "sem_perfil",
  "outro",
]);

export const markLeadLostSchema = z.object({
  leadId: z.string().uuid(),
  reason: lostReasonSchema,
});

export type MarkLeadLostInput = z.infer<typeof markLeadLostSchema>;
