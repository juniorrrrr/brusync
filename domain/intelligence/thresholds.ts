/** Default thresholds for every rule — the factory value used whenever
 * intelligence_rules has no row for that key (or the row's config is
 * missing that specific field), and always what Modo Demonstração uses
 * (it never touches intelligence_rules). Keys match the `config` jsonb
 * seeded onto each row by the Fase 19 migration, so the two stay in sync
 * by construction: whoever edits a rule's threshold in the database only
 * overrides these, never replaces the logic that reads them. */
export const INTELLIGENCE_THRESHOLDS = {
  leads_parados: { staleDays: 7 },
  responsavel_baixa_conversao: { minLeads: 5, belowAveragePercent: 20 },
  cliente_parado: { staleDays: 60 },
  inadimplencia_crescente: { growthPercent: 10 },
  tempo_resposta_subindo: { growthPercent: 15 },
  pipeline_congestionado: { multiplier: 1.6 },
  queda_conversao: { dropPercent: 10 },
  cac_subindo: { growthPercent: 15 },
  roas_caindo: { dropPercent: 15 },
  ticket_medio_caindo: { dropPercent: 10 },
  ciclo_venda_excessivo: { benchmarkDays: 30 },
  lead_sem_contato: { days: 2 },
  lead_parado_alerta: { days: 10 },
  campanha_gasto_elevado: { roiThreshold: 0 },
  receita_abaixo_media: { belowAveragePercent: 15 },
  queda_brusca_vendas: { dropPercent: 25 },
  pipeline_sem_movimentacao: { days: 3 },
  api_indisponivel: { minSuccessRate: 90 },
  storage_proximo_limite: { limitBytes: 1024 * 1024 * 1024, warnPercent: 80 },
  falha_automacao: { minFailures: 3 },
} as const;

export type IntelligenceRuleKey = keyof typeof INTELLIGENCE_THRESHOLDS;

/** Resolves a single numeric threshold field for a rule, preferring the
 * value stored in intelligence_rules.config (as configured by an
 * administrator) over the factory default above. */
export function resolveThreshold<K extends IntelligenceRuleKey>(
  key: K,
  field: keyof (typeof INTELLIGENCE_THRESHOLDS)[K],
  overrides: Record<string, Record<string, number>>,
): number {
  const override = overrides[key]?.[field as string];
  if (typeof override === "number") return override;
  return INTELLIGENCE_THRESHOLDS[key][field] as number;
}
