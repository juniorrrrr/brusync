import { NextResponse } from "next/server";
import { listReminders } from "@/repositories/agenda/remindersRepository";
import { getLeadById } from "@/repositories/crm/leadsRepository";
import { getSupabaseServerClient } from "@/services/supabase/server";
import { runWhatsappAutomation } from "@/services/whatsapp/whatsappAutomationService";

export const dynamic = "force-dynamic";

/** Vercel Cron target (vercel.json, uma vez por dia — mesma cadência de
 * meta-retry/automation-stalled-check; o plano do projeto não suporta
 * schedule sub-diário) — checa o gatilho de WhatsApp baseado em tempo
 * ("lembrete": lembretes da Agenda vencidos com lead vinculado).
 * "Aniversário" está preparado (AUTOMATION_TRIGGERS inclui 'aniversario')
 * mas não tem disparo automático nesta fase — o schema de leads/clientes
 * não tem campo de data de nascimento em nenhum módulo existente, e criar
 * um exigiria alterar o CRM, fora do escopo desta fase (ver relatório
 * técnico). */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();
  const now = Date.now();

  const dueReminders = (await listReminders(supabase, { status: "pendente", limit: 200 })).filter(
    (reminder) => reminder.crmLeadId && new Date(reminder.remindAt).getTime() <= now,
  );

  let sent = 0;
  for (const reminder of dueReminders) {
    const lead = await getLeadById(supabase, reminder.crmLeadId as string);
    if (!lead) continue;
    const result = await runWhatsappAutomation(supabase, "lembrete", {
      id: lead.id,
      name: lead.name,
      phone: lead.phone,
    });
    if (result.ok) sent += 1;
  }

  return NextResponse.json({ ok: true, checked: dueReminders.length, sent });
}
