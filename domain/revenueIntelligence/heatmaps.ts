import { MARKETING_ORIGIN_LABEL, MARKETING_ORIGINS } from "@/domain/marketing/originRules";
import type {
  HeatmapCell,
  HeatmapGrid,
  RevenueHeatmapsData,
  RevenueLeadRow,
} from "@/types/revenueIntelligence";

const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const HOUR_LABELS = Array.from({ length: 24 }, (_, hour) => `${hour}h`);
const MONTH_SHORT_FORMATTER = new Intl.DateTimeFormat("pt-BR", { month: "short" });

function buildGrid(
  title: string,
  rowLabels: string[],
  colLabels: string[],
  counts: Map<string, number>,
): HeatmapGrid {
  const cells: HeatmapCell[] = [];
  let maxValue = 0;
  rowLabels.forEach((_, rowIndex) => {
    colLabels.forEach((_, colIndex) => {
      const value = counts.get(`${rowIndex}:${colIndex}`) ?? 0;
      if (value > maxValue) maxValue = value;
      cells.push({ rowIndex, colIndex, value });
    });
  });
  return { title, rowLabels, colLabels, cells, maxValue };
}

function orderedStageLabels(leads: RevenueLeadRow[]): string[] {
  const seen = new Map<string, number>();
  for (const lead of leads) {
    if (!seen.has(lead.stageLabel)) seen.set(lead.stageLabel, lead.stagePosition);
  }
  return [...seen.entries()].sort((a, b) => a[1] - b[1]).map(([label]) => label);
}

/** "Mapa de horários" + "Mapa de dias" combinados num único heatmap dia da
 * semana × hora — a leitura padrão de mercado para essa dupla de dimensões
 * (ex.: heatmap de atividade do GitHub), em vez de duas tiras 1D redundantes. */
export function buildHourWeekdayHeatmap(leads: RevenueLeadRow[]): HeatmapGrid {
  const counts = new Map<string, number>();
  for (const lead of leads) {
    const date = new Date(lead.createdAt);
    const key = `${date.getDay()}:${date.getHours()}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return buildGrid("Leads por dia da semana e horário", WEEKDAY_LABELS, HOUR_LABELS, counts);
}

export function buildMonthHeatmap(leads: RevenueLeadRow[], months = 12): HeatmapGrid {
  const now = new Date();
  const keys: string[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  const colIndexByKey = new Map(keys.map((key, index) => [key, index]));

  const counts = new Map<string, number>();
  for (const lead of leads) {
    const colIndex = colIndexByKey.get(lead.createdAt.slice(0, 7));
    if (colIndex === undefined) continue;
    const mapKey = `0:${colIndex}`;
    counts.set(mapKey, (counts.get(mapKey) ?? 0) + 1);
  }

  const colLabels = keys.map((key) => {
    const [year, month] = key.split("-").map(Number);
    const label = MONTH_SHORT_FORMATTER.format(new Date(year, month - 1, 1));
    return label.charAt(0).toUpperCase() + label.slice(1).replace(".", "");
  });

  return buildGrid("Leads por mês", ["Volume"], colLabels, counts);
}

/** "Mapa de origem" cruzado com "Mapa de pipeline" (etapa) — mostra em qual
 * etapa cada origem de marketing está concentrada. */
export function buildOriginStageHeatmap(leads: RevenueLeadRow[]): HeatmapGrid {
  const stageLabels = orderedStageLabels(leads);
  const originsPresent = MARKETING_ORIGINS.filter((origin) =>
    leads.some((lead) => lead.origin === origin),
  );
  const rowLabels = originsPresent.map((origin) => MARKETING_ORIGIN_LABEL[origin]);
  const rowIndexByOrigin = new Map(originsPresent.map((origin, index) => [origin, index]));
  const colIndexByStage = new Map(stageLabels.map((label, index) => [label, index]));

  const counts = new Map<string, number>();
  for (const lead of leads) {
    const rowIndex = rowIndexByOrigin.get(lead.origin);
    const colIndex = colIndexByStage.get(lead.stageLabel);
    if (rowIndex === undefined || colIndex === undefined) continue;
    const key = `${rowIndex}:${colIndex}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return buildGrid("Origem × Etapa do pipeline", rowLabels, stageLabels, counts);
}

/** "Mapa de cidade" cruzado com "Mapa de pipeline" (etapa), limitado às
 * cidades com mais leads para caber na tela. */
export function buildCityStageHeatmap(leads: RevenueLeadRow[], topCities = 8): HeatmapGrid {
  const stageLabels = orderedStageLabels(leads);
  const cityCounts = new Map<string, number>();
  for (const lead of leads) {
    const city = lead.city ?? "Sem cidade";
    cityCounts.set(city, (cityCounts.get(city) ?? 0) + 1);
  }
  const rowLabels = [...cityCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topCities)
    .map(([city]) => city);
  const rowIndexByCity = new Map(rowLabels.map((city, index) => [city, index]));
  const colIndexByStage = new Map(stageLabels.map((label, index) => [label, index]));

  const counts = new Map<string, number>();
  for (const lead of leads) {
    const city = lead.city ?? "Sem cidade";
    const rowIndex = rowIndexByCity.get(city);
    const colIndex = colIndexByStage.get(lead.stageLabel);
    if (rowIndex === undefined || colIndex === undefined) continue;
    const key = `${rowIndex}:${colIndex}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return buildGrid("Cidade × Etapa do pipeline", rowLabels, stageLabels, counts);
}

export function buildRevenueHeatmaps(leads: RevenueLeadRow[]): RevenueHeatmapsData {
  return {
    hourWeekday: buildHourWeekdayHeatmap(leads),
    month: buildMonthHeatmap(leads),
    originStage: buildOriginStageHeatmap(leads),
    cityStage: buildCityStageHeatmap(leads),
  };
}
