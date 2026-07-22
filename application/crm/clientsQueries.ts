import "server-only";

import { getDemoClientDetailData, getDemoClientsPageData } from "@/lib/demo/mockCrm";
import {
  getClientById,
  type ListClientsOptions,
  listClients,
} from "@/repositories/crm/clientsRepository";
import { listOwnerOptions } from "@/repositories/crm/leadsRepository";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type { ClientWithOwner } from "@/types/crm";

export interface ClientsPageData {
  clients: ClientWithOwner[];
  owners: { id: string; name: string | null; email: string | null }[];
}

export async function getClientsPageData(
  options: ListClientsOptions = {},
): Promise<ClientsPageData> {
  if (await isDemoModeActive()) return getDemoClientsPageData(options);

  const supabase = await getSupabaseAuthClient();
  const [clients, owners] = await Promise.all([
    listClients(supabase, options),
    listOwnerOptions(supabase),
  ]);

  return { clients, owners };
}

export async function getClientDetailData(clientId: string): Promise<ClientWithOwner | null> {
  if (await isDemoModeActive()) return getDemoClientDetailData(clientId);

  const supabase = await getSupabaseAuthClient();
  return getClientById(supabase, clientId);
}
