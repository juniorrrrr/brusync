import { z } from "zod";

export const journeyStageSchema = z.enum([
  "novo_lead",
  "primeiro_contato",
  "contato_realizado",
  "lead_qualificado",
  "lead_desqualificado",
  "reuniao_agendada",
  "diagnostico",
  "proposta_enviada",
  "negociacao",
  "venda_ganha",
  "venda_perdida",
  "implantacao",
  "cliente_ativo",
]);

export const recordJourneyEventSchema = z.object({
  crmLeadId: z.string().uuid(),
  stage: journeyStageSchema,
  note: z.string().trim().max(2000).optional(),
});

export type RecordJourneyEventInput = z.infer<typeof recordJourneyEventSchema>;
