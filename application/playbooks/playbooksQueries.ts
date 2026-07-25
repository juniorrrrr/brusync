import "server-only";

import { requireCrmProfile } from "@/application/crm/authGuard";
import {
  getPlaybookDashboardData,
  getPlaybookDetail,
  getPlaybookForLead,
  getPlaybooksPageData,
  getPlaybookTemplates,
} from "@/services/playbooks/playbooksService";
import type {
  PlaybookDashboardData,
  PlaybookDetail,
  PlaybookListFilters,
  PlaybooksPageData,
  PlaybookTemplate,
} from "@/types/playbooks";

export async function fetchPlaybookDashboardData(): Promise<PlaybookDashboardData> {
  await requireCrmProfile();
  return getPlaybookDashboardData();
}

export async function fetchPlaybooksPageData(
  filters: PlaybookListFilters = {},
): Promise<PlaybooksPageData> {
  await requireCrmProfile();
  return getPlaybooksPageData(filters);
}

export async function fetchPlaybookTemplates(): Promise<PlaybookTemplate[]> {
  await requireCrmProfile();
  return getPlaybookTemplates();
}

export async function fetchPlaybookDetail(id: string): Promise<PlaybookDetail | null> {
  await requireCrmProfile();
  return getPlaybookDetail(id);
}

export async function fetchLeadPlaybook(leadId: string): Promise<PlaybookDetail | null> {
  await requireCrmProfile();
  return getPlaybookForLead(leadId);
}
