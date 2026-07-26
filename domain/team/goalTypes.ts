import type { GoalDirection, TeamGoalPeriodType, TeamGoalType } from "@/types/team";

export type TeamGoalUnit = "moeda" | "numero" | "percentual" | "minutos";

export interface TeamGoalTypeMeta {
  label: string;
  unit: TeamGoalUnit;
  defaultDirection: GoalDirection;
}

/** Só os 7 indicadores pedidos para metas de colaborador (Fase 25) — mais
 * enxuto que GOAL_TYPE_META de performance (Fase 23) porque aqui o escopo é
 * sempre "um colaborador", nunca empresa/campanha/canal/etc. */
export const TEAM_GOAL_TYPE_META: Record<TeamGoalType, TeamGoalTypeMeta> = {
  receita: { label: "Receita", unit: "moeda", defaultDirection: "maior_melhor" },
  leads: { label: "Leads", unit: "numero", defaultDirection: "maior_melhor" },
  conversao: { label: "Conversão", unit: "percentual", defaultDirection: "maior_melhor" },
  projetos: { label: "Projetos", unit: "numero", defaultDirection: "maior_melhor" },
  clientes: { label: "Clientes", unit: "numero", defaultDirection: "maior_melhor" },
  atividades: { label: "Atividades", unit: "numero", defaultDirection: "maior_melhor" },
  tempo_resposta: {
    label: "Tempo de Resposta",
    unit: "minutos",
    defaultDirection: "menor_melhor",
  },
};

export const TEAM_GOAL_TYPES: TeamGoalType[] = Object.keys(TEAM_GOAL_TYPE_META) as TeamGoalType[];

export const TEAM_GOAL_PERIOD_LABEL: Record<TeamGoalPeriodType, string> = {
  mensal: "Mensal",
  trimestral: "Trimestral",
  anual: "Anual",
};

export const TEAM_GOAL_PERIOD_TYPES: TeamGoalPeriodType[] = ["mensal", "trimestral", "anual"];

export function formatTeamGoalValue(value: number, unit: TeamGoalUnit): string {
  switch (unit) {
    case "moeda":
      return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    case "percentual":
      return `${value.toFixed(1)}%`;
    case "minutos":
      return `${value.toFixed(0)} min`;
    default:
      return value.toLocaleString("pt-BR");
  }
}
