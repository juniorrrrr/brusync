import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { buildFeed } from "@/domain/intelligence/feed";
import { generateRecommendations } from "@/domain/intelligence/recommendations";
import {
  type AlertCandidate,
  generateAlertCandidates,
  generateInsightCandidates,
  type InsightCandidate,
} from "@/domain/intelligence/rules";
import { computeAllScores } from "@/domain/intelligence/scoring";
import { generateTrendList } from "@/domain/intelligence/trends";
import * as alertsRepo from "@/repositories/intelligence/alertsRepository";
import * as insightsRepo from "@/repositories/intelligence/insightsRepository";
import * as rulesRepo from "@/repositories/intelligence/rulesRepository";
import * as scoresRepo from "@/repositories/intelligence/scoresRepository";
import * as snapshotsRepo from "@/repositories/intelligence/snapshotsRepository";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { buildOperationalDataset } from "@/services/intelligence/intelligenceDataService";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type {
  IntelligenceAlert,
  IntelligenceDashboardData,
  IntelligenceDateRange,
  IntelligenceInsight,
  IntelligencePeriodKey,
  IntelligenceScoreCategory,
} from "@/types/intelligence";

const SCORE_CATEGORIES: IntelligenceScoreCategory[] = [
  "comercial",
  "marketing",
  "financeiro",
  "operacional",
  "atendimento",
  "geral",
];

function candidateToEphemeralInsight(
  candidate: InsightCandidate,
  index: number,
  range: IntelligenceDateRange,
): IntelligenceInsight {
  const now = new Date().toISOString();
  return {
    id: `demo-insight-${index}-${candidate.ruleKey}`,
    ruleKey: candidate.ruleKey,
    type: candidate.type,
    category: candidate.category,
    severity: candidate.severity,
    title: candidate.title,
    description: candidate.description,
    metricValue: candidate.metricValue,
    metricUnit: candidate.metricUnit,
    trend: candidate.trend,
    relatedEntityType: candidate.relatedEntityType,
    relatedEntityId: candidate.relatedEntityId,
    evidence: candidate.evidence,
    periodFrom: range.from,
    periodTo: range.to,
    status: "ativo",
    createdAt: now,
    updatedAt: now,
  };
}

function candidateToEphemeralAlert(candidate: AlertCandidate, index: number): IntelligenceAlert {
  const now = new Date().toISOString();
  return {
    id: `demo-alert-${index}-${candidate.ruleKey}`,
    ruleKey: candidate.ruleKey,
    type: candidate.type,
    category: candidate.category,
    severity: candidate.severity,
    title: candidate.title,
    description: candidate.description,
    relatedEntityType: candidate.relatedEntityType,
    relatedEntityId: candidate.relatedEntityId,
    evidence: candidate.evidence,
    status: "ativo",
    acknowledgedByName: null,
    acknowledgedAt: null,
    resolvedAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

async function persistInsights(
  supabase: SupabaseClient,
  candidates: InsightCandidate[],
  range: IntelligenceDateRange,
): Promise<IntelligenceInsight[]> {
  const keepIds: string[] = [];
  for (const candidate of candidates) {
    const existing = await insightsRepo.findActiveByRuleAndEntity(
      supabase,
      candidate.ruleKey,
      candidate.relatedEntityId,
    );
    await insightsRepo.upsertInsight(
      supabase,
      existing?.id ?? null,
      candidate,
      range.from,
      range.to,
    );
    if (existing?.id) keepIds.push(existing.id);
  }
  // Re-fetch to also capture ids assigned to brand-new rows this run.
  const active = await insightsRepo.listActiveInsights(supabase);
  const activeRuleEntityKeys = new Set(
    candidates.map((c) => `${c.ruleKey}:${c.relatedEntityId ?? ""}`),
  );
  const finalKeepIds = active
    .filter((i) => activeRuleEntityKeys.has(`${i.ruleKey}:${i.relatedEntityId ?? ""}`))
    .map((i) => i.id);
  await insightsRepo.resolveInsightsNotIn(supabase, finalKeepIds);
  return active.filter((i) => finalKeepIds.includes(i.id));
}

async function persistAlerts(
  supabase: SupabaseClient,
  candidates: AlertCandidate[],
): Promise<IntelligenceAlert[]> {
  for (const candidate of candidates) {
    const existing = await alertsRepo.findActiveByRuleAndEntity(
      supabase,
      candidate.ruleKey,
      candidate.relatedEntityId,
    );
    await alertsRepo.upsertAlert(supabase, existing?.id ?? null, candidate);
  }
  const active = await alertsRepo.listActiveAlerts(supabase);
  const activeRuleEntityKeys = new Set(
    candidates.map((c) => `${c.ruleKey}:${c.relatedEntityId ?? ""}`),
  );
  const finalKeepIds = active
    .filter((a) => activeRuleEntityKeys.has(`${a.ruleKey}:${a.relatedEntityId ?? ""}`))
    .map((a) => a.id);
  await alertsRepo.resolveAlertsNotIn(supabase, finalKeepIds);
  return active.filter((a) => finalKeepIds.includes(a.id));
}

/** Runs the full Fase 19 engine: assemble the operational dataset from
 * every module already contributing to it, evaluate every rule against it,
 * compute scores/trends/recommendations/feed, and — outside Modo
 * Demonstração — persist the result (upserting active insights/alerts,
 * auto-resolving ones whose condition cleared, recording today's score and
 * snapshot for tomorrow's "período anterior" comparisons). Safe to call on
 * every dashboard load: persistence is idempotent per rule+entity. */
export async function runIntelligenceEngine(
  period: IntelligencePeriodKey,
  custom?: IntelligenceDateRange,
): Promise<IntelligenceDashboardData> {
  const demo = await isDemoModeActive();
  const dataset = await buildOperationalDataset(period, custom);

  const ruleConfig = demo
    ? {}
    : await (async () => {
        const supabase = await getSupabaseAuthClient();
        return rulesRepo.getEnabledRuleConfig(supabase);
      })();

  const enabledKeys = demo
    ? null
    : await (async () => {
        const supabase = await getSupabaseAuthClient();
        return rulesRepo.getEnabledRuleKeys(supabase);
      })();

  let insightCandidates = generateInsightCandidates(dataset, ruleConfig);
  let alertCandidates = generateAlertCandidates(dataset, ruleConfig);
  if (enabledKeys) {
    insightCandidates = insightCandidates.filter((c) => enabledKeys.has(c.ruleKey));
    alertCandidates = alertCandidates.filter((c) => enabledKeys.has(c.ruleKey));
  }

  const scores = computeAllScores(dataset);
  const trends = generateTrendList(dataset);
  const recommendations = generateRecommendations(insightCandidates, alertCandidates);

  let insights: IntelligenceInsight[];
  let alerts: IntelligenceAlert[];

  if (demo) {
    insights = insightCandidates.map((c, i) => candidateToEphemeralInsight(c, i, dataset.range));
    alerts = alertCandidates.map((c, i) => candidateToEphemeralAlert(c, i));
  } else {
    const supabase = await getSupabaseAuthClient();
    [insights, alerts] = await Promise.all([
      persistInsights(supabase, insightCandidates, dataset.range),
      persistAlerts(supabase, alertCandidates),
    ]);

    const today = new Date().toISOString().slice(0, 10);
    await Promise.all([
      ...SCORE_CATEGORIES.map((category) =>
        scoresRepo.upsertScore(supabase, {
          scoreDate: today,
          category,
          score: scores[category].score,
          explanation: scores[category].explanation,
          factors: scores[category].factors,
        }),
      ),
      snapshotsRepo.upsertSnapshot(supabase, today, {
        overdueAmount: dataset.financial.current.overdueAmount,
        monthRevenue: dataset.financial.current.monthRevenue,
        cac: dataset.marketing.current.cac.value,
        roas: dataset.marketing.current.roas.value,
        conversionRate: dataset.marketing.current.conversionRate,
      }),
    ]);
  }

  const feed = buildFeed(insights, alerts);
  const criticalAlertsCount = alerts.filter((a) => a.severity === "critico").length;

  return {
    insightsCount: insights.length,
    activeAlertsCount: alerts.length,
    criticalAlertsCount,
    scores,
    insights,
    alerts,
    recommendations,
    trends,
    feed,
    range: dataset.range,
    previousRange: dataset.previousRange,
  };
}
