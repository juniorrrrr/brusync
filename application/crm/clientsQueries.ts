import "server-only";

import {
  getClientById,
  type ListClientsOptions,
  listClients,
} from "@/repositories/crm/clientsRepository";
import { listOwnerOptions } from "@/repositories/crm/leadsRepository";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import type { ClientWithOwner } from "@/types/crm";

export interface ClientsPageData {
  clients: ClientWithOwner[];
  owners: { id: string; name: string | null; email: string | null }[];
}

export async function getClientsPageData(
  options: ListClientsOptions = {},
): Promise<ClientsPageData> {
  const supabase = await getSupabaseAuthClient();
  const [clients, owners] = await Promise.all([
    listClients(supabase, options),
    listOwnerOptions(supabase),
  ]);

  return { clients, owners };
}

export async function getClientDetailData(clientId: string): Promise<ClientWithOwner | null> {
  const supabase = await getSupabaseAuthClient();
  return getClientById(supabase, clientId);
}
