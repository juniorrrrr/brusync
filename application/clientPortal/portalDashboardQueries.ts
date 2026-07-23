import "server-only";

import { getDemoPortalDashboardData } from "@/lib/demo/mockClientPortal";
import { requirePortalAccess } from "@/services/clientPortal/portalAccessService";
import { getPortalDashboardData } from "@/services/clientPortal/portalDashboardService";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type { PortalAccess, PortalDashboardData } from "@/types/clientPortal";

export async function getPortalDashboardPageData(): Promise<{
  access: PortalAccess;
  dashboard: PortalDashboardData;
}> {
  const access = await requirePortalAccess();

  if (await isDemoModeActive()) {
    return { access, dashboard: getDemoPortalDashboardData() };
  }

  const supabase = await getSupabaseAuthClient();
  const dashboard = await getPortalDashboardData(supabase, access.clientId);
  return { access, dashboard };
}
