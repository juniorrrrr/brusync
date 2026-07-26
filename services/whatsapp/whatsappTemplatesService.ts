import "server-only";

import { getDemoWhatsappTemplates } from "@/lib/demo/mockWhatsapp";
import { getAccountSecrets, getActiveAccount } from "@/repositories/whatsapp/accountsRepository";
import {
  createTemplate,
  deleteTemplate,
  listTemplates,
  upsertRemoteTemplate,
} from "@/repositories/whatsapp/templatesRepository";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { decryptToken } from "@/services/metaConversionsApi/tokenCrypto";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import { getWhatsappProvider } from "@/services/whatsapp/whatsappProviderFactory";
import type {
  WhatsappTemplate,
  WhatsappTemplateCategory,
  WhatsappTemplateComponent,
} from "@/types/whatsapp";

export async function getTemplates(): Promise<WhatsappTemplate[]> {
  if (await isDemoModeActive()) return getDemoWhatsappTemplates();
  const supabase = await getSupabaseAuthClient();
  const account = await getActiveAccount(supabase);
  return listTemplates(supabase, account?.id);
}

export async function createDraftTemplate(params: {
  name: string;
  category: WhatsappTemplateCategory;
  language: string;
  components: WhatsappTemplateComponent[];
}): Promise<void> {
  const supabase = await getSupabaseAuthClient();
  const account = await getActiveAccount(supabase);
  if (!account) throw new Error("Nenhuma conta do WhatsApp conectada.");

  await createTemplate(supabase, { accountId: account.id, ...params });
}

export async function removeTemplate(id: string): Promise<void> {
  const supabase = await getSupabaseAuthClient();
  await deleteTemplate(supabase, id);
}

/** Busca os templates aprovados/pendentes/rejeitados diretamente na Graph
 * API (via WhatsappProvider — nunca a API chamada daqui) e faz upsert local
 * — nunca inventa um template que não existe na Meta. */
export async function syncTemplatesFromMeta(): Promise<{ synced: number }> {
  const supabase = await getSupabaseAuthClient();
  const account = await getActiveAccount(supabase);
  if (!account) throw new Error("Nenhuma conta do WhatsApp conectada.");

  const secrets = await getAccountSecrets(supabase, account.id);
  if (!secrets?.access_token_ciphertext || !secrets.access_token_iv) {
    throw new Error("Credenciais da conta não configuradas.");
  }

  const provider = getWhatsappProvider();
  const remoteTemplates = await provider.listApprovedTemplates({
    phoneNumberId: secrets.phone_number_id,
    wabaId: secrets.waba_id,
    accessToken: decryptToken(secrets.access_token_ciphertext, secrets.access_token_iv),
  });

  for (const template of remoteTemplates) {
    await upsertRemoteTemplate(supabase, {
      accountId: account.id,
      name: template.name,
      category: template.category,
      language: template.language,
      status: template.status,
      components: template.components,
      metaTemplateId: template.metaTemplateId,
    });
  }

  return { synced: remoteTemplates.length };
}
