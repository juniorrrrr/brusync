import { z } from "zod";

export const clientStatusSchema = z.enum(["ativo", "inativo", "em_risco"]);

export const createClientSchema = z.object({
  company: z.string().trim().min(1, "Informe a empresa"),
  name: z.string().trim().optional(),
  email: z.string().trim().email("E-mail inválido").optional().or(z.literal("")),
  phone: z.string().trim().optional(),
  ownerId: z.string().uuid().optional().or(z.literal("")),
  status: clientStatusSchema.optional(),
  sourceCrmLeadId: z.string().uuid().optional(),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;

export const updateClientSchema = z.object({
  clientId: z.string().uuid(),
  company: z.string().trim().min(1).optional(),
  name: z.string().trim().optional(),
  email: z.string().trim().email("E-mail inválido").optional().or(z.literal("")),
  phone: z.string().trim().optional(),
  ownerId: z.string().uuid().optional().or(z.literal("")),
  status: clientStatusSchema.optional(),
});

export type UpdateClientInput = z.infer<typeof updateClientSchema>;
