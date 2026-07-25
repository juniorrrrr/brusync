import type { AgendaEvent } from "@/types/agenda";
import type { FinancialBreakdownItem, FinancialMarketingIndicators } from "@/types/financial";
import type { GoalScopeType, GoalType } from "@/types/performance";
import type { Project } from "@/types/projects";
import type { RevenueLeadRow } from "@/types/revenueIntelligence";

export interface ActualValueScope {
  scopeType: GoalScopeType;
  scopeRef: string | null;
}

export interface StaffMember {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
}

/** Valores "empresa inteira" já computados por outros módulos — reaproveitados
 * tal qual para os tipos sem quebra por dono/equipe em lugar nenhum do
 * código (CAC/ROI/ROAS: investimento não tem dono; tempo de resposta/tempo
 * até contato/tempo de fechamento: agregados sobre toda a operação; receitas
 * recebidas/parcelas em atraso/ticket médio: FinancialDashboardData não tem
 * quebra por dono). Só usados quando scope_type = 'empresa' — a UI de
 * criação de meta não oferece outro escopo para esses tipos
 * (domain/performance/goalTypes.ts::GOAL_TYPE_META[...].validScopes).
 *
 * Limitação aceita conscientemente: estes valores refletem o estado ATUAL
 * (mesma limitação que RevenueFinancialKpis já tem), não uma reconstrução
 * histórica exata do período da meta quando esse período não é o corrente —
 * documentado no relatório final da Fase 23. */
export interface CompanyWideMetrics {
  averageTicket: number;
  receivedRevenue: number;
  overdueInstallmentsCount: number;
  cac: number | null;
  roi: number | null;
  roas: number | null;
  averageResponseMinutes: number | null;
  averageTimeToFirstContactDays: number | null;
  averageTimeToWinDays: number | null;
  predictedRevenue: number;
  confirmedRevenue: number;
  lostRevenue: number;
}

export interface ActualValueDataset {
  /** Já filtrado ao período da meta pelo chamador (leads criados dentro de
   * period_start..period_end). */
  leads: RevenueLeadRow[];
  /** Sem filtro de período — completedAt/status é checado aqui dentro. */
  projects: Project[];
  /** Já filtrado a eventType='reuniao' e ao período pelo chamador. */
  agendaEvents: AgendaEvent[];
  staff: StaffMember[];
  /** Breakdowns de receita real já computados (Fase 14/16) — usados para
   * "receita" em qualquer escopo que não seja 'empresa'. Mesma limitação de
   * "estado atual" do CompanyWideMetrics (ver acima). */
  financialMarketing: FinancialMarketingIndicators;
  company: CompanyWideMetrics;
}

function buildStaffIndexes(staff: StaffMember[]) {
  const roleById = new Map(staff.map((s) => [s.id, s.role]));
  const nameById = new Map(staff.map((s) => [s.id, s.name ?? s.email ?? ""]));
  const roleByName = new Map(staff.map((s) => [(s.name ?? s.email ?? "").toLowerCase(), s.role]));
  return { roleById, nameById, roleByName };
}

function ownerScopeFilter<T extends { ownerId: string | null }>(
  items: T[],
  scope: ActualValueScope,
  roleById: Map<string, string>,
): T[] {
  if (scope.scopeType === "empresa") return items;
  if (scope.scopeType === "usuario") return items.filter((item) => item.ownerId === scope.scopeRef);
  if (scope.scopeType === "equipe") {
    return items.filter(
      (item) => item.ownerId !== null && roleById.get(item.ownerId) === scope.scopeRef,
    );
  }
  return [];
}

function filterLeadsByScope(
  leads: RevenueLeadRow[],
  scope: ActualValueScope,
  roleById: Map<string, string>,
): RevenueLeadRow[] {
  if (scope.scopeType === "campanha")
    return leads.filter((l) => (l.utmCampaign ?? "Sem campanha") === scope.scopeRef);
  if (scope.scopeType === "canal")
    return leads.filter((l) => (l.utmMedium ?? "Sem canal") === scope.scopeRef);
  if (scope.scopeType === "cidade")
    return leads.filter((l) => (l.city ?? "Sem cidade") === scope.scopeRef);
  if (scope.scopeType === "origem") return leads.filter((l) => l.origin === scope.scopeRef);
  if (scope.scopeType === "pipeline") return leads.filter((l) => l.stageId === scope.scopeRef);
  return ownerScopeFilter(leads, scope, roleById);
}

function filterProjectsByScope(
  projects: Project[],
  scope: ActualValueScope,
  roleById: Map<string, string>,
): Project[] {
  if (scope.scopeType === "projeto") return projects.filter((p) => p.id === scope.scopeRef);
  return ownerScopeFilter(projects, scope, roleById);
}

function filterAgendaByScope(
  events: AgendaEvent[],
  scope: ActualValueScope,
  roleById: Map<string, string>,
): AgendaEvent[] {
  return ownerScopeFilter(events, scope, roleById);
}

function sumBreakdown(items: FinancialBreakdownItem[], label: string): number {
  return items.find((item) => item.label === label)?.value ?? 0;
}

function revenueForScope(
  indicators: FinancialMarketingIndicators,
  scope: ActualValueScope,
  nameById: Map<string, string>,
  roleByName: Map<string, string>,
): number | null {
  switch (scope.scopeType) {
    case "usuario": {
      const name = scope.scopeRef ? nameById.get(scope.scopeRef) : undefined;
      return name ? sumBreakdown(indicators.revenueByOwner, name) : null;
    }
    case "equipe":
      return indicators.revenueByOwner
        .filter((item) => roleByName.get(item.label.toLowerCase()) === scope.scopeRef)
        .reduce((sum, item) => sum + item.value, 0);
    case "campanha":
      return sumBreakdown(indicators.revenueByCampaign, scope.scopeRef ?? "");
    case "canal":
      return sumBreakdown(indicators.revenueByChannel, scope.scopeRef ?? "");
    case "cidade":
      return sumBreakdown(indicators.revenueByCity, scope.scopeRef ?? "");
    case "origem":
      return sumBreakdown(indicators.revenueByOrigin, scope.scopeRef ?? "");
    default:
      return null;
  }
}

function isWon(lead: RevenueLeadRow): boolean {
  return lead.wonEnteredAt !== null;
}

function reachedStagePosition(lead: RevenueLeadRow, position: number): boolean {
  return lead.stagePosition >= position;
}

const QUALIFIED_STAGE_POSITION = 3; // "qualificado" — novo=1, contato=2, qualificado=3, proposta=4, fechado=5
const PROPOSAL_STAGE_POSITION = 4;

/** Único ponto que decide "quanto essa meta realizou" — um caso por tipo,
 * cada um reaproveitando o dataset já buscado (nunca uma nova query). Tipos
 * sem quebra por escopo fora de 'empresa' (ver validScopes em goalTypes.ts)
 * caem direto nos agregados de `dataset.company`. */
export function computeActualValue(
  type: GoalType,
  scope: ActualValueScope,
  dataset: ActualValueDataset,
): number | null {
  const { roleById, nameById, roleByName } = buildStaffIndexes(dataset.staff);

  switch (type) {
    case "leads":
      return filterLeadsByScope(dataset.leads, scope, roleById).length;

    case "leads_qualificados":
      return filterLeadsByScope(dataset.leads, scope, roleById).filter((l) =>
        reachedStagePosition(l, QUALIFIED_STAGE_POSITION),
      ).length;

    case "propostas":
      return filterLeadsByScope(dataset.leads, scope, roleById).filter((l) =>
        reachedStagePosition(l, PROPOSAL_STAGE_POSITION),
      ).length;

    case "vendas":
      return filterLeadsByScope(dataset.leads, scope, roleById).filter(isWon).length;

    case "conversao": {
      const scoped = filterLeadsByScope(dataset.leads, scope, roleById);
      if (scoped.length === 0) return null;
      const won = scoped.filter((l) => l.clientCreatedAt !== null).length;
      return (won / scoped.length) * 100;
    }

    case "reunioes":
      return filterAgendaByScope(dataset.agendaEvents, scope, roleById).length;

    case "projetos_concluidos":
      return filterProjectsByScope(dataset.projects, scope, roleById).filter(
        (p) => p.status === "concluido",
      ).length;

    case "receita":
      if (scope.scopeType === "empresa") return dataset.company.confirmedRevenue;
      return revenueForScope(dataset.financialMarketing, scope, nameById, roleByName);

    case "ticket_medio":
      return scope.scopeType === "empresa" ? dataset.company.averageTicket : null;
    case "receitas_recebidas":
      return scope.scopeType === "empresa" ? dataset.company.receivedRevenue : null;
    case "parcelas_atraso":
      return scope.scopeType === "empresa" ? dataset.company.overdueInstallmentsCount : null;
    case "cac":
      return scope.scopeType === "empresa" ? dataset.company.cac : null;
    case "roi":
      return scope.scopeType === "empresa" ? dataset.company.roi : null;
    case "roas":
      return scope.scopeType === "empresa" ? dataset.company.roas : null;
    case "tempo_resposta":
      return scope.scopeType === "empresa" ? dataset.company.averageResponseMinutes : null;
    case "tempo_primeiro_contato":
      return scope.scopeType === "empresa" ? dataset.company.averageTimeToFirstContactDays : null;
    case "tempo_fechamento":
      return scope.scopeType === "empresa" ? dataset.company.averageTimeToWinDays : null;

    default:
      return null;
  }
}
