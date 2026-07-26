import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { EventType } from "@/domain/events/types";
import { EVENT_TYPE_TO_WHATSAPP_TRIGGER } from "@/domain/whatsapp/eventMap";
import { getLeadById } from "@/repositories/crm/leadsRepository";
import { runWhatsappAutomation } from "@/services/whatsapp/whatsappAutomationService";

/** Chamado por services/automation/automationEngine.ts::
 * runAutomationsForEvent — o MESMO dispatcher central que já roda as
 * automations do CRM (Fase 10), logo depois da checagem de Modo
 * Demonstração. Nunca lança: um erro aqui não pode derrubar a ação de
 * negócio que publicou o evento (mesmo contrato do restante do arquivo). */
export async function dispatchWhatsappAutomationForEvent(
  supabase: SupabaseClient,
  eventType: EventType,
  payload: Record<string, unknown>,
): Promise<void> {
  const triggerType = EVENT_TYPE_TO_WHATSAPP_TRIGGER[eventType];
  if (!triggerType) return;

  const leadId = typeof payload.leadId === "string" ? payload.leadId : null;
  if (!leadId) return;

  try {
    const lead = await getLeadById(supabase, leadId);
    if (!lead) return;
    await runWhatsappAutomation(supabase, triggerType, {
      id: lead.id,
      name: lead.name,
      phone: lead.phone,
    });
  } catch {
    // Nunca propaga — mesmo contrato de runAutomationsForEvent.
  }
}
