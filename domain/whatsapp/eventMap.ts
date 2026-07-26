import type { EventType } from "@/domain/events/types";
import type { WhatsappAutomationTrigger } from "@/types/whatsapp";

/** Ponte aditiva entre o Event Bus (Fase 6) e o vocabulário de gatilhos do
 * WhatsApp (Fase 28) — mesmo espírito de
 * domain/automation/eventMap.ts::EVENT_TYPE_TO_AUTOMATION_TRIGGER (Fase 10),
 * só que para whatsapp_automations em vez de automation_workflows. Reusa os
 * MESMOS eventos já publicados por LeadCreated/LeadWon/RevenueRegistered/
 * MeetingScheduled — nenhum publishEvent() novo é adicionado em
 * Financeiro/Projetos/Agenda para esta fase (ver relatório técnico:
 * "projeto iniciado/finalizado" ficam sem disparo automático por não
 * existir hoje um EventType equivalente, e criar um exigiria alterar
 * services/projects/*, fora do escopo desta fase). */
export const EVENT_TYPE_TO_WHATSAPP_TRIGGER: Partial<Record<EventType, WhatsappAutomationTrigger>> =
  {
    LeadCreated: "novo_lead",
    LeadWon: "venda_concluida",
    RevenueRegistered: "pagamento_recebido",
    MeetingScheduled: "agendamento_confirmado",
  };
