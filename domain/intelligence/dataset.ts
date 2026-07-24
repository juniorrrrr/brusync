import type { DashboardData } from "@/application/crm/dashboardQueries";
import type { AutomationHealth } from "@/types/automation";
import type { ConversionsHealthSummary } from "@/types/conversions";
import type { FinancialDashboardData } from "@/types/financial";
import type { IntegrationHealthSummary } from "@/types/integrations";
import type { IntelligenceDateRange } from "@/types/intelligence";
import type { CampaignRow, ExecutiveMetrics, OriginMetrics } from "@/types/marketing";
import type { Project, ProjectsHealth } from "@/types/projects";

export interface StaleLead {
  id: string;
  name: string;
  company: string | null;
  ownerName: string | null;
  lastInteractionAt: string | null;
  daysSinceContact: number;
}

export interface OwnerConversion {
  ownerId: string | null;
  ownerName: string;
  totalLeads: number;
  wonLeads: number;
  winRate: number;
}

export interface DelinquentClient {
  clientId: string;
  clientCompany: string;
  overdueAmount: number;
  overdueCount: number;
  oldestDueDate: string;
}

export interface OverdueProject {
  id: string;
  name: string;
  clientCompany: string | null;
  dueAt: string;
  daysOverdue: number;
}

/** Everything the Fase 19 rules/scoring/trends engine consumes, assembled
 * by services/intelligence/intelligenceDataService.ts from the SAME
 * application-layer functions each module's own dashboard already uses
 * (getDashboardData, getExecutiveMetrics, getFinancialDashboardData, ...) —
 * no table here is read twice, and every field is traceable back to one of
 * those calls. Domain code only ever sees this shape, never a Supabase
 * client, which is what keeps every rule pure and reproducible. */
export interface OperationalDataset {
  range: IntelligenceDateRange;
  previousRange: IntelligenceDateRange;
  generatedAt: string;

  crm: {
    current: DashboardData;
    staleLeads: StaleLead[];
    neverContactedLeads: StaleLead[];
    ownerConversion: OwnerConversion[];
    daysSinceLastStageChange: number | null;
  };

  marketing: {
    current: ExecutiveMetrics;
    previous: ExecutiveMetrics;
    campaigns: CampaignRow[];
    origins: OriginMetrics[];
  };

  financial: {
    current: FinancialDashboardData;
    previousOverdueAmount: number | null;
    previousRevenue: number | null;
    delinquentClients: DelinquentClient[];
    recentAverageRevenue: number | null;
  };

  projects: {
    health: ProjectsHealth;
    overdue: OverdueProject[];
    allActive: Project[];
  };

  communication: {
    averageResponseMinutes: number | null;
    previousAverageResponseMinutes: number | null;
  };

  integrations: IntegrationHealthSummary;
  automation: AutomationHealth;
  conversions: ConversionsHealthSummary;

  storage: {
    totalBytes: number;
  };

  scoreHistory: Record<string, { date: string; score: number }[]>;
}
