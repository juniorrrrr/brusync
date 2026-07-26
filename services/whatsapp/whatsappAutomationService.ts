import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { getDemoWhatsappAutomations, getDemoWhatsappTemplates } from "@/lib/demo/mockWhatsapp";
import { getAccountSecrets, getActiveAccount } from "@/repositories/whatsapp/accountsRepository";
import {
  createAutomation,
  deleteAutomation,
  listActiveAutomationsForTrigger,
  listAutomations,
  setAutomationStatus,
} from "@/repositories/whatsapp/automationsRepository";
import { getContactByWaId } from "@/repositories/whatsapp/contactsRepository";
import { createMessage } from "@/repositories/whatsapp/messagesRepository";
import { listTemplates } from "@/repositories/whatsapp/templatesRepository";
import { isDemoModeActive } from "@/services/demo/demoMode";
import { decryptToken } from "@/services/metaConversionsApi/tokenCrypto";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";
import { findOrCreateConversationForContact } from "@/services/whatsapp/whatsappChatService";
import { getWhatsappProvider } from "@/services/whatsapp/whatsappProviderFactory";
import type { WhatsappAutomationsPageData, WhatsappAutomationTrigger } from "@/types/whatsapp";

export async function getAutomationsPageData(): Promise<WhatsappAutomationsPageData> {
  if (await isDemoModeActive()) {
    return { automations: getDemoWhatsappAutomations(), templates: getDemoWhatsappTemplates() };
  }
  const supabase = await getSupabaseAuthClient();
  const account = await getActiveAccount(supabase);
  const [automations, templates] = await Promise.all([
    listAutomations(supabase),
    listTemplates(supabase, account?.id),
  ]);
  return { automations, templates };
}

export async function createWhatsappAutomation(params: {
  triggerType: WhatsappAutomationTrigger;
  templateId: string | null;
  createdBy: string | null;
}): Promise<void> {
  const supabase = await getSupabaseAuthClient();
  const account = await getActiveAccount(supabase);
  if (!account) throw new Error("Nenhuma conta do WhatsApp conectada.");

  await createAutomation(supabase, {
    accountId: account.id,
    triggerType: params.triggerType,
    templateId: params.templateId,
    config: {},
    createdBy: params.createdBy,
  });
}

export async function toggleWhatsappAutomation(id: string, active: boolean): Promise<void> {
  const supabase = await getSupabaseAuthClient();
  await setAutomationStatus(supabase, id, active ? "ativo" : "inativo");
}

export async function removeWhatsappAutomation(id: string): Promise<void> {
  const supabase = await getSupabaseAuthClient();
  await deleteAutomation(supabase, id);
}

/** Envia o template configurado para o lead do gatilho — chamado por
 * services/automation/automationEngine.ts (novo case "enviar_whatsapp") e
 * por app/api/cron/whatsapp-scheduled-triggers/route.ts (aniversário/
 * lembrete). Nunca inventa uma conversa nova: se o lead ainda não tem
 * telefone/WhatsApp cadastrado, a automação simplesmente não dispara —
 * documentado como limitação aceita, mesmo espírito da Fase 23 para dados
 * ausentes. */
export async function runWhatsappAutomation(
  supabase: SupabaseClient,
  triggerType: WhatsappAutomationTrigger,
  lead: { id: string; name: string; phone: string | null },
): Promise<{ ok: boolean; message: string }> {
  if (await isDemoModeActive())
    return { ok: false, message: "Modo Demonstração — envio simulado." };
  if (!lead.phone) return { ok: false, message: "Lead sem telefone cadastrado." };

  const account = await getActiveAccount(supabase);
  if (!account) return { ok: false, message: "Nenhuma conta do WhatsApp conectada." };

  const automations = await listActiveAutomationsForTrigger(supabase, triggerType);
  if (automations.length === 0)
    return { ok: false, message: "Nenhuma automação ativa para este gatilho." };

  const automation = automations[0];
  if (!automation.templateId) return { ok: false, message: "Automação sem template configurado." };

  const secrets = await getAccountSecrets(supabase, account.id);
  if (!secrets?.access_token_ciphertext || !secrets.access_token_iv) {
    return { ok: false, message: "Credenciais da conta não configuradas." };
  }

  const waId = lead.phone.replace(/\D/g, "");
  const { conversationId } = await findOrCreateConversationForContact(
    account.id,
    waId,
    lead.name,
    lead.phone,
  );

  const provider = getWhatsappProvider();
  const result = await provider.sendTemplateMessage(
    {
      phoneNumberId: secrets.phone_number_id,
      wabaId: secrets.waba_id,
      accessToken: decryptToken(secrets.access_token_ciphertext, secrets.access_token_iv),
    },
    {
      to: waId,
      templateName: automation.templateName ?? "",
      language: "pt_BR",
      variables: [lead.name],
    },
  );

  await createMessage(supabase, {
    conversationId,
    direction: "outbound",
    type: "template",
    templateId: automation.templateId,
    waMessageId: result.waMessageId,
    status: "enviado",
  });

  return { ok: true, message: `Template "${automation.templateName}" enviado para ${lead.name}.` };
}

export async function findContactForLead(
  supabase: SupabaseClient,
  accountId: string,
  waId: string,
) {
  return getContactByWaId(supabase, accountId, waId);
}
