import "server-only";

import { linkContactToCrm } from "@/repositories/whatsapp/contactsRepository";
import { updateConversation } from "@/repositories/whatsapp/conversationsRepository";
import { getSupabaseAuthClient } from "@/services/supabase/authServer";

/** Vincula uma conversa a um lead/cliente/projeto já existente — sempre por
 * referência (FK), nunca copiando dado do CRM para dentro do WhatsApp.
 * "Oportunidade" do enunciado é o próprio lead em uma etapa avançada do
 * funil — não existe uma entidade "oportunidade" separada neste CRM (ver
 * domain/crm), então o vínculo é sempre por lead/cliente/projeto. */
export async function linkConversationToLead(
  conversationId: string,
  contactId: string,
  crmLeadId: string | null,
): Promise<void> {
  const supabase = await getSupabaseAuthClient();
  await Promise.all([
    updateConversation(supabase, conversationId, { crmLeadId }),
    linkContactToCrm(supabase, contactId, { crmLeadId }),
  ]);
}

export async function linkConversationToClient(
  conversationId: string,
  contactId: string,
  clientId: string | null,
): Promise<void> {
  const supabase = await getSupabaseAuthClient();
  await Promise.all([
    updateConversation(supabase, conversationId, { clientId }),
    linkContactToCrm(supabase, contactId, { clientId }),
  ]);
}

export async function linkConversationToProject(
  conversationId: string,
  projectId: string | null,
): Promise<void> {
  const supabase = await getSupabaseAuthClient();
  await updateConversation(supabase, conversationId, { projectId });
}
