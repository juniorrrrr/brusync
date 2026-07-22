import { z } from "zod";

export const upsertCampaignSpendSchema = z.object({
  utmSource: z.string().trim().min(1, "Informe a origem (utm_source)"),
  utmCampaign: z.string().trim().min(1, "Informe a campanha (utm_campaign)"),
  periodMonth: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "Informe o mês no formato AAAA-MM")
    .transform((value) => `${value}-01`),
  amount: z.coerce.number().nonnegative("Valor não pode ser negativo"),
  notes: z.string().trim().optional(),
});

export type UpsertCampaignSpendInput = z.infer<typeof upsertCampaignSpendSchema>;
