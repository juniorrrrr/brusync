import "server-only";

import { requireCrmProfile } from "@/application/crm/authGuard";
import {
  getRevenueAlertsData,
  getRevenueCommercialData,
  getRevenueFinancialData,
  getRevenueForecastData,
  getRevenueHeatmapsData,
  getRevenueRankingsData,
} from "@/services/revenueIntelligence/revenueIntelligenceService";
import type {
  ConversionAnalysisData,
  RevenueAlertsData,
  RevenueFinancialData,
  RevenueForecastData,
  RevenueHeatmapsData,
  RevenueRankings,
} from "@/types/revenueIntelligence";

/** Wrappers finos, um por aba de /receita — guard de sessão (defesa em
 * profundidade, mesmo padrão de application/intelligence/*Queries.ts) e
 * delega para services/revenueIntelligence/revenueIntelligenceService.ts,
 * que já é 100% ciente de Modo Demonstração. */

export async function fetchRevenueForecastData(): Promise<RevenueForecastData> {
  await requireCrmProfile();
  return getRevenueForecastData();
}

export async function fetchRevenueCommercialData(): Promise<ConversionAnalysisData> {
  await requireCrmProfile();
  return getRevenueCommercialData();
}

export async function fetchRevenueFinancialData(): Promise<RevenueFinancialData> {
  await requireCrmProfile();
  return getRevenueFinancialData();
}

export async function fetchRevenueRankingsData(): Promise<RevenueRankings> {
  await requireCrmProfile();
  return getRevenueRankingsData();
}

export async function fetchRevenueHeatmapsData(): Promise<RevenueHeatmapsData> {
  await requireCrmProfile();
  return getRevenueHeatmapsData();
}

export async function fetchRevenueAlertsData(): Promise<RevenueAlertsData> {
  await requireCrmProfile();
  return getRevenueAlertsData();
}
