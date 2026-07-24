import type {
  DelinquentClient,
  OverdueProject,
  OwnerConversion,
  StaleLead,
} from "@/domain/intelligence/dataset";
import { getDemoClientsPageData } from "@/lib/demo/mockCrm";
import { getDemoProjects } from "@/lib/demo/mockProjects";
import type { ExecutiveMetrics } from "@/types/marketing";

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

/** The handful of cross-module evidence queries
 * (repositories/intelligence/crossModuleRepository.ts) that have no
 * equivalent already-demo-aware application function elsewhere to borrow
 * from — kept small and clearly fictitious, reusing the same demo clients/
 * projects other modules already show for cross-module consistency. */

export function getDemoStaleLeads(staleDays: number): StaleLead[] {
  const plans = [
    { name: "Rafael Nogueira", company: "Nogueira Consultoria", owner: "Marcelo Tanaka", days: 9 },
    { name: "Beatriz Lemos", company: "Lemos & Cia", owner: "Isabela Monteiro", days: 14 },
    { name: "Carlos Andrade", company: "Andrade Log", owner: "Felipe Aragão", days: 22 },
    { name: "Patrícia Vieira", company: "Vieira Digital", owner: "Marcelo Tanaka", days: 11 },
  ];
  return plans
    .filter((p) => p.days >= staleDays)
    .map((p, i) => ({
      id: `00000000-i019-4000-8000-00000000010${i}`,
      name: p.name,
      company: p.company,
      ownerName: p.owner,
      lastInteractionAt: daysAgoIso(p.days),
      daysSinceContact: p.days,
    }));
}

export function getDemoNeverContactedLeads(): StaleLead[] {
  const plans = [
    { name: "Juliana Barros", company: "Barros Engenharia", owner: "Isabela Monteiro", days: 4 },
    { name: "Eduardo Faria", company: "Faria Comércio", owner: "Felipe Aragão", days: 3 },
  ];
  return plans.map((p, i) => ({
    id: `00000000-i019-4000-8000-00000000020${i}`,
    name: p.name,
    company: p.company,
    ownerName: p.owner,
    lastInteractionAt: null,
    daysSinceContact: p.days,
  }));
}

export function getDemoOwnerConversion(): OwnerConversion[] {
  return [
    {
      ownerId: "demo-owner-1",
      ownerName: "Marcelo Tanaka",
      totalLeads: 24,
      wonLeads: 9,
      winRate: 37.5,
    },
    {
      ownerId: "demo-owner-2",
      ownerName: "Isabela Monteiro",
      totalLeads: 20,
      wonLeads: 7,
      winRate: 35,
    },
    {
      ownerId: "demo-owner-3",
      ownerName: "Felipe Aragão",
      totalLeads: 18,
      wonLeads: 3,
      winRate: 16.7,
    },
  ];
}

export function getDemoDelinquentClients(): DelinquentClient[] {
  const { clients } = getDemoClientsPageData({});
  const plans = [
    { index: 2, amount: 8200, count: 2, daysOverdue: 12 },
    { index: 4, amount: 3400, count: 1, daysOverdue: 25 },
  ];
  return plans
    .filter((p) => clients[p.index])
    .map((p) => ({
      clientId: clients[p.index].id,
      clientCompany: clients[p.index].company,
      overdueAmount: p.amount,
      overdueCount: p.count,
      oldestDueDate: daysAgoIso(p.daysOverdue),
    }));
}

export function getDemoOverdueProjects(): OverdueProject[] {
  const { projects } = getDemoProjects();
  const plans = [
    { index: 0, daysOverdue: 6 },
    { index: 2, daysOverdue: 18 },
  ];
  return plans
    .filter((p) => projects[p.index])
    .map((p) => ({
      id: projects[p.index].id,
      name: projects[p.index].name,
      clientCompany: projects[p.index].clientCompany,
      dueAt: daysAgoIso(p.daysOverdue),
      daysOverdue: p.daysOverdue,
    }));
}

/** getExecutiveMetrics ignores its date filters in Modo Demonstração (it
 * always returns the same fixture, see lib/demo/mockMarketing.ts) — so
 * current and previous would otherwise be identical and every CAC/ROAS/
 * ticket/conversão trend rule would never fire. This builds a plausible
 * "período anterior foi um pouco melhor" previous snapshot from the same
 * fixture, coherent across every metric (never an isolated, contradictory
 * number) purely for Modo Demonstração's trend comparisons. */
export function getDemoPreviousExecutiveMetrics(current: ExecutiveMetrics): ExecutiveMetrics {
  const scale = (value: number | null, factor: number) => (value === null ? null : value * factor);

  return {
    totalInvestment: {
      ...current.totalInvestment,
      value: scale(current.totalInvestment.value, 0.95),
    },
    totalRevenue: current.totalRevenue * 1.09,
    roas: { ...current.roas, value: scale(current.roas.value, 1.15) },
    roi: { ...current.roi, value: scale(current.roi.value, 1.1) },
    cac: { ...current.cac, value: scale(current.cac.value, 0.85) },
    leadsCount: Math.round(current.leadsCount * 1.05),
    qualifiedLeadsCount: Math.round(current.qualifiedLeadsCount * 1.05),
    clientsCount: Math.round(current.clientsCount * 1.18),
    averageTicket: scale(current.averageTicket, 1.11),
    conversionRate: current.conversionRate * 1.12,
    averageTimeToWinDays: current.averageTimeToWinDays,
  };
}

export function getDemoAverageResponseMinutes(): number {
  return 47;
}

export function getDemoStorageBytes(): number {
  return 320 * 1024 * 1024;
}

/** 30-day synthetic walk around a plausible baseline per category — only
 * used to draw the "Evolução histórica" sparkline in Modo Demonstração,
 * which never writes to intelligence_scores. */
export function getDemoScoreHistory(): Record<string, { date: string; score: number }[]> {
  const baselines: Record<string, number> = {
    comercial: 68,
    marketing: 74,
    financeiro: 61,
    operacional: 82,
    atendimento: 70,
    geral: 71,
  };

  const history: Record<string, { date: string; score: number }[]> = {};
  for (const [category, baseline] of Object.entries(baselines)) {
    const points: { date: string; score: number }[] = [];
    let seed = baseline;
    for (let i = 29; i >= 0; i--) {
      const wobble = Math.round(Math.sin(i / 3 + baseline) * 4);
      seed = Math.min(95, Math.max(35, baseline + wobble));
      points.push({ date: daysAgoIso(i).slice(0, 10), score: seed });
    }
    history[category] = points;
  }
  return history;
}
