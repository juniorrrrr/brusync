import type { StageConversion } from "@/repositories/crm/dashboardRepository";
import type { CrmLeadWithRelations, PipelineStage } from "@/types/crm";
import type {
  PipelineForecastStageRow,
  RevenueForecastPoint,
  RevenueForecastSummary,
} from "@/types/revenueIntelligence";

/** Probabilidade de uma etapa aberta chegar a "ganho", derivada do histórico
 * real de conversão entre etapas (stageConversion, já calculado em
 * repositories/crm/dashboardRepository::getStageConversion) — produto das
 * taxas de conversão de cada etapa seguinte até a etapa vencedora. Quando o
 * histórico não tem dado suficiente para algum trecho, cai para a taxa de
 * vitória geral (overallWinRate) em vez de propagar null/NaN. */
export function computeStageWinProbabilities(
  stages: PipelineStage[],
  stageConversion: StageConversion[],
  overallWinRate: number,
): Map<string, number> {
  const ordered = [...stages].sort((a, b) => a.position - b.position);
  const wonIndex = ordered.findIndex((s) => s.isWon);
  const conversionByStageId = new Map(stageConversion.map((c) => [c.stage.id, c]));

  const probabilities = new Map<string, number>();
  for (let i = 0; i < ordered.length; i++) {
    const stage = ordered[i];
    if (stage.isWon) {
      probabilities.set(stage.id, 100);
      continue;
    }
    if (wonIndex === -1 || i >= wonIndex) {
      probabilities.set(stage.id, overallWinRate);
      continue;
    }

    let probability = 1;
    let hasGap = false;
    for (let j = i + 1; j <= wonIndex; j++) {
      const conversion = conversionByStageId.get(ordered[j].id)?.conversionFromPrevious;
      if (conversion === null || conversion === undefined) {
        hasGap = true;
        break;
      }
      probability *= conversion / 100;
    }
    probabilities.set(stage.id, hasGap ? overallWinRate : probability * 100);
  }

  return probabilities;
}

export function computePipelineForecast(
  openLeads: CrmLeadWithRelations[],
  stages: PipelineStage[],
  winProbabilities: Map<string, number>,
): { predictedRevenue: number; byStage: PipelineForecastStageRow[] } {
  const ordered = [...stages].sort((a, b) => a.position - b.position).filter((s) => !s.isWon);

  const byStage = ordered.map((stage) => {
    const stageLeads = openLeads.filter((lead) => lead.stageId === stage.id);
    const openValue = stageLeads.reduce((sum, lead) => sum + (lead.potentialValue ?? 0), 0);
    const winProbability = winProbabilities.get(stage.id) ?? 0;
    return {
      stage,
      openCount: stageLeads.length,
      openValue,
      winProbability,
      weightedValue: openValue * (winProbability / 100),
    };
  });

  return {
    predictedRevenue: byStage.reduce((sum, row) => sum + row.weightedValue, 0),
    byStage,
  };
}

export function sumLostRevenue(lostLeads: CrmLeadWithRelations[]): number {
  return lostLeads.reduce((sum, lead) => sum + (lead.potentialValue ?? 0), 0);
}

function periodKeyForMonth(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

const MONTH_LABEL = new Intl.DateTimeFormat("pt-BR", { month: "short", year: "2-digit" });
function monthLabel(key: string): string {
  const [year, month] = key.split("-").map(Number);
  const label = MONTH_LABEL.format(new Date(year, month - 1, 1));
  return label.charAt(0).toUpperCase() + label.slice(1).replace(".", "");
}

function quarterKeyForMonth(date: Date): string {
  const quarter = Math.floor(date.getMonth() / 3) + 1;
  return `${date.getFullYear()}-T${quarter}`;
}

/** Estima em qual mês/trimestre/ano o valor ponderado de cada lead aberto
 * deve virar receita — usando data de criação do lead + ciclo médio real de
 * vendas (averageTimeToWinDays, já calculado em
 * repositories/crm/dashboardRepository::getAverageTimeToWinDays) como data
 * esperada de fechamento. Nenhuma data de fechamento é inventada: é só a
 * extrapolação padrão (criação + ciclo médio histórico). Leads sem ciclo
 * médio disponível (histórico insuficiente) entram apenas no total geral,
 * não nos buckets de período. */
export function estimateForecastByPeriod(
  openLeads: CrmLeadWithRelations[],
  winProbabilities: Map<string, number>,
  averageTimeToWinDays: number | null,
): {
  monthly: RevenueForecastPoint[];
  quarterly: RevenueForecastPoint[];
  annual: RevenueForecastPoint[];
} {
  const monthlyTotals = new Map<string, number>();
  const quarterlyTotals = new Map<string, number>();
  const annualTotals = new Map<string, number>();

  if (averageTimeToWinDays !== null) {
    for (const lead of openLeads) {
      const probability = (winProbabilities.get(lead.stageId) ?? 0) / 100;
      const weightedValue = (lead.potentialValue ?? 0) * probability;
      if (weightedValue <= 0) continue;

      const expectedClose = new Date(
        new Date(lead.createdAt).getTime() + averageTimeToWinDays * 86_400_000,
      );

      const monthKey = periodKeyForMonth(expectedClose);
      monthlyTotals.set(monthKey, (monthlyTotals.get(monthKey) ?? 0) + weightedValue);

      const quarterKey = quarterKeyForMonth(expectedClose);
      quarterlyTotals.set(quarterKey, (quarterlyTotals.get(quarterKey) ?? 0) + weightedValue);

      const yearKey = String(expectedClose.getFullYear());
      annualTotals.set(yearKey, (annualTotals.get(yearKey) ?? 0) + weightedValue);
    }
  }

  const now = new Date();
  const monthly: RevenueForecastPoint[] = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const key = periodKeyForMonth(d);
    monthly.push({ key, label: monthLabel(key), forecastValue: monthlyTotals.get(key) ?? 0 });
  }

  const quarterly: RevenueForecastPoint[] = [];
  for (let i = 0; i < 4; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i * 3, 1);
    const key = quarterKeyForMonth(d);
    quarterly.push({
      key,
      label: `${key.split("-")[1]}/${key.slice(2, 4)}`,
      forecastValue: quarterlyTotals.get(key) ?? 0,
    });
  }

  const annual: RevenueForecastPoint[] = [];
  for (let i = 0; i < 2; i++) {
    const year = String(now.getFullYear() + i);
    annual.push({ key: year, label: year, forecastValue: annualTotals.get(year) ?? 0 });
  }

  return { monthly, quarterly, annual };
}

export function buildRevenueForecastSummary(
  predictedRevenue: number,
  confirmedRevenue: number,
  lostRevenue: number,
  byStage: PipelineForecastStageRow[],
): RevenueForecastSummary {
  return { predictedRevenue, confirmedRevenue, lostRevenue, byStage };
}
