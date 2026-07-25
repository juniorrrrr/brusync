import type { GoalDirection, GoalPeriodType, GoalScopeType, GoalType } from "@/types/performance";

export type GoalUnit = "moeda" | "numero" | "percentual" | "dias" | "minutos";

export interface GoalTypeMeta {
  label: string;
  unit: GoalUnit;
  defaultDirection: GoalDirection;
  /** Escopos que fazem sentido para este tipo — a UI de criação de meta só
   * oferece estes. Tipos financeiros agregados (CAC/ROI/ROAS/tempo de
   * resposta/tempo até contato/tempo de fechamento/receitas recebidas/
   * parcelas em atraso) só têm versão empresa: o investimento de marketing
   * e os relatórios financeiros de FinancialDashboardData não têm dono nem
   * campanha nativos neste schema (ver relatório da Fase 23). */
  validScopes: GoalScopeType[];
}

export const GOAL_TYPE_META: Record<GoalType, GoalTypeMeta> = {
  receita: {
    label: "Receita",
    unit: "moeda",
    defaultDirection: "maior_melhor",
    validScopes: ["empresa", "equipe", "usuario", "campanha", "canal", "cidade", "origem"],
  },
  leads: {
    label: "Leads",
    unit: "numero",
    defaultDirection: "maior_melhor",
    validScopes: ["empresa", "equipe", "usuario", "campanha", "canal", "cidade", "origem"],
  },
  leads_qualificados: {
    label: "Leads Qualificados",
    unit: "numero",
    defaultDirection: "maior_melhor",
    validScopes: ["empresa", "equipe", "usuario", "campanha", "canal", "cidade", "origem"],
  },
  reunioes: {
    label: "Reuniões",
    unit: "numero",
    defaultDirection: "maior_melhor",
    validScopes: ["empresa", "equipe", "usuario"],
  },
  propostas: {
    label: "Propostas",
    unit: "numero",
    defaultDirection: "maior_melhor",
    validScopes: ["empresa", "equipe", "usuario", "pipeline"],
  },
  vendas: {
    label: "Vendas",
    unit: "numero",
    defaultDirection: "maior_melhor",
    validScopes: ["empresa", "equipe", "usuario", "campanha", "canal", "cidade", "origem"],
  },
  conversao: {
    label: "Conversão",
    unit: "percentual",
    defaultDirection: "maior_melhor",
    validScopes: ["empresa", "equipe", "usuario", "campanha", "canal", "cidade", "origem"],
  },
  ticket_medio: {
    label: "Ticket Médio",
    unit: "moeda",
    defaultDirection: "maior_melhor",
    validScopes: ["empresa"],
  },
  cac: { label: "CAC", unit: "moeda", defaultDirection: "menor_melhor", validScopes: ["empresa"] },
  roi: {
    label: "ROI",
    unit: "percentual",
    defaultDirection: "maior_melhor",
    validScopes: ["empresa"],
  },
  roas: {
    label: "ROAS",
    unit: "numero",
    defaultDirection: "maior_melhor",
    validScopes: ["empresa"],
  },
  tempo_resposta: {
    label: "Tempo de Resposta",
    unit: "minutos",
    defaultDirection: "menor_melhor",
    validScopes: ["empresa"],
  },
  tempo_primeiro_contato: {
    label: "Tempo até Primeiro Contato",
    unit: "dias",
    defaultDirection: "menor_melhor",
    validScopes: ["empresa"],
  },
  tempo_fechamento: {
    label: "Tempo Médio de Fechamento",
    unit: "dias",
    defaultDirection: "menor_melhor",
    validScopes: ["empresa"],
  },
  projetos_concluidos: {
    label: "Projetos Concluídos",
    unit: "numero",
    defaultDirection: "maior_melhor",
    validScopes: ["empresa", "equipe", "usuario", "projeto"],
  },
  receitas_recebidas: {
    label: "Receitas Recebidas",
    unit: "moeda",
    defaultDirection: "maior_melhor",
    validScopes: ["empresa"],
  },
  parcelas_atraso: {
    label: "Parcelas em Atraso",
    unit: "numero",
    defaultDirection: "menor_melhor",
    validScopes: ["empresa"],
  },
};

export const GOAL_TYPES: GoalType[] = Object.keys(GOAL_TYPE_META) as GoalType[];

export const GOAL_SCOPE_LABEL: Record<GoalScopeType, string> = {
  empresa: "Empresa",
  equipe: "Equipe",
  usuario: "Usuário",
  campanha: "Campanha",
  canal: "Canal",
  cidade: "Cidade",
  origem: "Origem",
  pipeline: "Etapa do Pipeline",
  projeto: "Projeto",
};

export const GOAL_SCOPE_TYPES: GoalScopeType[] = [
  "empresa",
  "equipe",
  "usuario",
  "campanha",
  "canal",
  "cidade",
  "origem",
  "pipeline",
  "projeto",
];

export const GOAL_PERIOD_LABEL: Record<GoalPeriodType, string> = {
  diario: "Diário",
  semanal: "Semanal",
  mensal: "Mensal",
  trimestral: "Trimestral",
  semestral: "Semestral",
  anual: "Anual",
  personalizado: "Personalizado",
};

export const GOAL_PERIOD_TYPES: GoalPeriodType[] = [
  "diario",
  "semanal",
  "mensal",
  "trimestral",
  "semestral",
  "anual",
  "personalizado",
];

/** Papéis que valem como "equipe" — os mesmos 4 que compõem
 * is_internal_staff() no banco; 'cliente' nunca é uma equipe interna. */
export const STAFF_ROLES = ["administrador", "gestor", "comercial", "atendimento"] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export const STAFF_ROLE_LABEL: Record<StaffRole, string> = {
  administrador: "Administradores",
  gestor: "Gestores",
  comercial: "Comercial",
  atendimento: "Atendimento",
};

export function formatGoalValue(value: number, unit: GoalUnit): string {
  switch (unit) {
    case "moeda":
      return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    case "percentual":
      return `${value.toFixed(1)}%`;
    case "dias":
      return `${value.toFixed(1)} dias`;
    case "minutos":
      return `${value.toFixed(0)} min`;
    default:
      return value.toLocaleString("pt-BR");
  }
}
