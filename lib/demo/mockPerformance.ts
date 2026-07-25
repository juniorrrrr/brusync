import type { StaffMember } from "@/domain/performance/actualValue";
import { resolveGoalPeriodDefault } from "@/domain/performance/periods";
import { DEMO_OWNERS } from "@/lib/demo/mockSeed";
import type { GoalStatus, PerformanceGoal } from "@/types/performance";

/** Papéis fictícios para os mesmos DEMO_OWNERS já usados em leads/projetos/
 * agenda (mockSeed.ts) — é o que faz "meta de equipe" bater com os mesmos
 * nomes que já aparecem nos outros módulos em Modo Demonstração. */
export function getDemoStaffWithRole(): StaffMember[] {
  const roleByIndex = ["gestor", "comercial", "comercial", "atendimento"];
  return DEMO_OWNERS.map((owner, index) => ({
    id: owner.id,
    name: owner.name,
    email: owner.email,
    role: roleByIndex[index] ?? "comercial",
  }));
}

const now = new Date();

function period(type: Parameters<typeof resolveGoalPeriodDefault>[0]) {
  return resolveGoalPeriodDefault(type, now);
}

let seq = 0;
function demoId(): string {
  seq += 1;
  return `00000000-perf-4000-8000-${String(seq).padStart(12, "0")}`;
}

function goal(
  partial: Omit<PerformanceGoal, "id" | "createdAt" | "updatedAt" | "createdBy" | "notes">,
): PerformanceGoal {
  return {
    ...partial,
    id: demoId(),
    notes: null,
    createdBy: DEMO_OWNERS[0].id,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

const ACTIVE_GOALS: PerformanceGoal[] = [
  goal({
    type: "receita",
    scopeType: "empresa",
    scopeRef: null,
    periodType: "mensal",
    ...period("mensal"),
    targetValue: 60000,
    direction: "maior_melhor",
    status: "ativa",
  }),
  goal({
    type: "leads",
    scopeType: "empresa",
    scopeRef: null,
    periodType: "mensal",
    ...period("mensal"),
    targetValue: 25,
    direction: "maior_melhor",
    status: "ativa",
  }),
  goal({
    type: "conversao",
    scopeType: "empresa",
    scopeRef: null,
    periodType: "mensal",
    ...period("mensal"),
    targetValue: 20,
    direction: "maior_melhor",
    status: "ativa",
  }),
  goal({
    type: "cac",
    scopeType: "empresa",
    scopeRef: null,
    periodType: "trimestral",
    ...period("trimestral"),
    targetValue: 2500,
    direction: "menor_melhor",
    status: "ativa",
  }),
  goal({
    type: "parcelas_atraso",
    scopeType: "empresa",
    scopeRef: null,
    periodType: "mensal",
    ...period("mensal"),
    targetValue: 1,
    direction: "menor_melhor",
    status: "ativa",
  }),
  goal({
    type: "vendas",
    scopeType: "usuario",
    scopeRef: DEMO_OWNERS[1].id,
    periodType: "mensal",
    ...period("mensal"),
    targetValue: 4,
    direction: "maior_melhor",
    status: "ativa",
  }),
  goal({
    type: "reunioes",
    scopeType: "usuario",
    scopeRef: DEMO_OWNERS[2].id,
    periodType: "semanal",
    ...period("semanal"),
    targetValue: 5,
    direction: "maior_melhor",
    status: "ativa",
  }),
  goal({
    type: "conversao",
    scopeType: "equipe",
    scopeRef: "comercial",
    periodType: "mensal",
    ...period("mensal"),
    targetValue: 18,
    direction: "maior_melhor",
    status: "ativa",
  }),
  goal({
    type: "leads",
    scopeType: "canal",
    scopeRef: "paid-social",
    periodType: "mensal",
    ...period("mensal"),
    targetValue: 12,
    direction: "maior_melhor",
    status: "ativa",
  }),
  goal({
    type: "projetos_concluidos",
    scopeType: "empresa",
    scopeRef: null,
    periodType: "trimestral",
    ...period("trimestral"),
    targetValue: 6,
    direction: "maior_melhor",
    status: "ativa",
  }),
];

const ARCHIVED_GOALS: PerformanceGoal[] = [
  goal({
    type: "receita",
    scopeType: "empresa",
    scopeRef: null,
    periodType: "mensal",
    periodStart: new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10),
    periodEnd: new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10),
    targetValue: 50000,
    direction: "maior_melhor",
    status: "arquivada",
  }),
  goal({
    type: "leads",
    scopeType: "empresa",
    scopeRef: null,
    periodType: "mensal",
    periodStart: new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10),
    periodEnd: new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10),
    targetValue: 20,
    direction: "maior_melhor",
    status: "arquivada",
  }),
];

export function getDemoGoals(status: GoalStatus): PerformanceGoal[] {
  return status === "ativa" ? ACTIVE_GOALS : ARCHIVED_GOALS;
}
