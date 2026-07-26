import "server-only";

import { listClients } from "@/repositories/crm/clientsRepository";
import { linkAdAccountToClient } from "@/repositories/metaAds/adAccountsRepository";
import { linkCampaignToProject } from "@/repositories/metaAds/campaignsRepository";
import { listProjects } from "@/repositories/projects/projectsRepository";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";

/** Vínculo Conta Meta ↔ Cliente/Responsável e Campanha ↔ Projeto — sempre
 * referência (FK), nunca cópia de dado do CRM. Reaproveita
 * repositories/crm/clientsRepository.ts e repositories/projects/
 * projectsRepository.ts já existentes; nenhuma lógica de cliente/projeto é
 * duplicada aqui. */
export async function setAdAccountCrmLink(
  adAccountId: string,
  clientId: string | null,
  responsibleId: string | null,
): Promise<void> {
  const supabase = await getSupabaseAuthClient();
  await linkAdAccountToClient(supabase, adAccountId, clientId, responsibleId);
}

export async function setCampaignProjectLink(
  campaignId: string,
  crmProjectId: string | null,
): Promise<void> {
  const supabase = await getSupabaseAuthClient();
  await linkCampaignToProject(supabase, campaignId, crmProjectId);
}

export async function listClientOptionsForLink(): Promise<{ id: string; company: string }[]> {
  const supabase = await getSupabaseAuthClient();
  const clients = await listClients(supabase, {});
  return clients.map((c) => ({ id: c.id, company: c.company }));
}

export async function listProjectOptionsForLink(): Promise<{ id: string; name: string }[]> {
  const supabase = await getSupabaseAuthClient();
  const { projects } = await listProjects(supabase, {});
  return projects.map((p) => ({ id: p.id, name: p.name }));
}

/** Sugestão simples por substring do nome da conta de anúncios no nome da
 * empresa — nunca aplica sozinho, só sugere; o usuário confirma o vínculo
 * na tela de Configurações. */
export async function suggestClientForAdAccount(adAccountName: string): Promise<string | null> {
  const supabase = await getSupabaseAuthClient();
  const clients = await listClients(supabase, {});
  const normalized = adAccountName.toLowerCase();
  const match = clients.find(
    (c) =>
      normalized.includes(c.company.toLowerCase()) || c.company.toLowerCase().includes(normalized),
  );
  return match?.id ?? null;
}
